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
  async (
    {
      organisationId,
      page = 1,
      limit = 10,
      search = "",
    }: {
      organisationId: string;
      page?: number;
      limit?: number;
      search?: string;
    },
    { rejectWithValue }
  ) => {
    if (!organisationId) {
      return rejectWithValue("Organisation ID missing");
    }

    const res = await axios.get("/items/get/data", {
      params: { organisationId, page, limit, search },
    });

    return res.data;
  }
);



export const createItem = createAsyncThunk(
  "itemMaster/create",
  async (data: Partial<ItemMaster>, { rejectWithValue }) => {
    try {
      const res = await axios.post("/items/create", data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Create failed");
    }
  }
);

export const updateItem = createAsyncThunk(
  "itemMaster/update",
  async (
    { id, data }: { id: string; data: Partial<ItemMaster> },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.put(`/items/update/${id}`, data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Update failed");
    }
  }
);

export const deleteItem = createAsyncThunk(
  "itemMaster/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/items/delete/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Delete failed");
    }
  }
);

/* SLICE */
const itemMasterSlice = createSlice({
  name: "itemMaster",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      /* ================= FETCH ================= */
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload?.data || [];
        state.pagination = action.payload?.pagination || initialState.pagination;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* ================= CREATE ================= */
      .addCase(createItem.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createItem.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      /* ================= UPDATE ================= */
      .addCase(updateItem.fulfilled, (state, action) => {
        const index = state.list.findIndex(
          (i) => i._id === action.payload._id
        );
        if (index !== -1) {
          state.list[index] = action.payload;
        }
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      /* ================= DELETE ================= */
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.list = state.list.filter((i) => i._id !== action.payload);
        state.pagination.total -= 1;
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});


export default itemMasterSlice.reducer;
