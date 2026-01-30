import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosApi from "@/utils/axiosApi";

// fetch organisationId from localStorage
const getOrgId = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("organisationId");
  }
  return null;
};

type MasterType = "category" | "hsn" | "supplier";

// ---------- API THUNKS ----------

// LIST (with pagination)
export const fetchInventoryMaster = createAsyncThunk(
  "inventoryMaster/fetch",
  async (
    {
      type,
      page = 1,
      limit = 10,
    }: { type: MasterType; page?: number; limit?: number },
    { rejectWithValue }
  ) => {
    try {
      const organisationId = getOrgId();

      const res = await axiosApi.get(
        `/inventory/${type}?page=${page}&limit=${limit}&organisationId=${organisationId}`
      );

      return { type, data: res.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to fetch");
    }
  }
);

// CREATE
export const addInventoryMaster = createAsyncThunk(
  "inventoryMaster/add",
  async (
    { type, data }: { type: MasterType; data: any },
    { rejectWithValue }
  ) => {
    try {
      const organisationId = getOrgId();
      const payload = { ...data, type, organisationId };

      const res = await axiosApi.post(`/inventory/${type}`, payload);

      return { type, data: res.data.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to create");
    }
  }
);

// UPDATE
export const updateInventoryMaster = createAsyncThunk(
  "inventoryMaster/update",
  async (
    { id, type, data }: { id: string; type: MasterType; data: any },
    { rejectWithValue }
  ) => {
    try {
      const organisationId = getOrgId();
      const payload = { ...data, organisationId };

      const res = await axiosApi.put(`/inventory/${id}`, payload);

      return { type, data: res.data.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to update");
    }
  }
);

// DELETE
export const deleteInventoryMaster = createAsyncThunk(
  "inventoryMaster/delete",
  async (
    { id, type }: { id: string; type: MasterType },
    { rejectWithValue }
  ) => {
    try {
      const organisationId = getOrgId();

      await axiosApi.delete(
        `/inventory/${id}?organisationId=${organisationId}`
      );

      return { type, id };
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to delete");
    }
  }
);

// ---------- INITIAL STATE ----------

interface InventoryState {
  category: any[];
  hsn: any[];
  supplier: any[];

  pagination: {
    category: { page: number; pages: number; total: number };
    hsn: { page: number; pages: number; total: number };
    supplier: { page: number; pages: number; total: number };
  };

  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  category: [],
  hsn: [],
  supplier: [],

  pagination: {
    category: { page: 1, pages: 1, total: 0 },
    hsn: { page: 1, pages: 1, total: 0 },
    supplier: { page: 1, pages: 1, total: 0 },
  },

  loading: false,
  error: null,
};

// ---------- SLICE ----------

const inventoryMasterSlice = createSlice({
  name: "inventoryMaster",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder

      // FETCH
      .addCase(fetchInventoryMaster.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventoryMaster.fulfilled, (state, action) => {
        state.loading = false;

        const { type, data } = action.payload;

        state[type] = data.items;

        state.pagination[type] = {
          page: data.page,
          pages: data.pages,
          total: data.total,
        };
      })
      .addCase(fetchInventoryMaster.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // CREATE
      .addCase(addInventoryMaster.fulfilled, (state, action) => {
        const { type, data } = action.payload;
        state[type].unshift(data);
      })

      // UPDATE
      .addCase(updateInventoryMaster.fulfilled, (state, action) => {
        const { type, data } = action.payload;
        state[type] = state[type].map((item) =>
          item._id === data._id ? data : item
        );
      })

      // DELETE
      .addCase(deleteInventoryMaster.fulfilled, (state, action) => {
        const { type, id } = action.payload;
        state[type] = state[type].filter((item) => item._id !== id);
      });
  },
});

export default inventoryMasterSlice.reducer;
