import api from "@/utils/axiosApi";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

/* -------------------- Types -------------------- */

export interface SparePart {
  _id: string;
  organisationId: string;
  code: string;
  name: string;
  equipmentLink?: string;
  vendor?: string;
  location?: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  costPerUnit: number;
  critical?: boolean;
  notes?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SparePartState {
  items: SparePart[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
}

/* -------------------- Initial State -------------------- */

const initialState: SparePartState = {
  items: [],
  loading: false,
  error: null,
  page: 1,
  totalPages: 1,
  total: 0,
};



/* -------------------- Async Thunks -------------------- */

// Fetch spare parts (organisation + pagination)
// In sparePartsSlice.ts
export const fetchSpareParts = createAsyncThunk(
  "spareParts/fetch",
  async (
    {
      organisationId,
      page = 1,
      limit = 10,
      search = "" // Add this parameter
    }: { organisationId: string; page?: number; limit?: number; search?: string },
    { rejectWithValue }
  ) => {
    try {
      // Append search query to URL
      const queryParam = search ? `&search=${search}` : "";
      const res = await api.get(
        `/spare-parts/${organisationId}?page=${page}&limit=${limit}${queryParam}`
      );
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

// Create spare part
export const createSparePart = createAsyncThunk(
  "spareParts/create",
  async (payload: Partial<SparePart>, thunkAPI) => {
    try {
      ///api/spare-parts
      const organisationId = localStorage.getItem("organisationId");
      const res = await api.post(`/spare-parts/${organisationId}`, {
        ...payload,
        organisationId,
      });
      return res.data.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// Update spare part
export const updateSparePart = createAsyncThunk(
  "spareParts/update",
  async (
    { id, data }: { id: string; data: Partial<SparePart> },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/spare-parts/update/${id}`, data);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

// Soft delete spare part
export const deleteSparePart = createAsyncThunk(
  "spareParts/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/spare-parts/delete/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

/* -------------------- Slice -------------------- */

const sparePartsSlice = createSlice({
  name: "spareParts",
  initialState,
  reducers: {
    resetSpareParts: () => initialState,

    toggleCriticalPart: (state, action) => {
      const part = state.items.find(p => p._id === action.payload);
      if (part) {
        part.critical = !part.critical;
        part.updatedAt = new Date().toISOString();
      }
    },

    adjustStock: (
      state,
      action: {
        payload: {
          partId: string;
          quantity: number;
          type: "ISSUE" | "RETURN";
        };
      }
    ) => {
      const { partId, quantity, type } = action.payload;
      const part = state.items.find(p => p._id === partId);

      if (!part) return;

      if (type === "ISSUE") {
        part.quantity -= quantity;
      } else {
        part.quantity += quantity;
      }

      part.updatedAt = new Date().toISOString();
    },
  },

  extraReducers: (builder) => {
    builder

      // FETCH
      .addCase(fetchSpareParts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSpareParts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
        state.total = action.payload.total;
      })
      .addCase(fetchSpareParts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // CREATE
      .addCase(createSparePart.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })

      // UPDATE
      .addCase(updateSparePart.fulfilled, (state, action) => {
        state.items = state.items.map((item) =>
          item._id === action.payload._id ? action.payload : item
        );
      })

      // DELETE (SOFT)
      .addCase(deleteSparePart.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => item._id !== action.payload
        );
      });
  },
});
export const {
  resetSpareParts,
  toggleCriticalPart,
  adjustStock,
} = sparePartsSlice.actions;

export default sparePartsSlice.reducer;

// import api from "@/utils/axiosApi";
// import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// /* -------------------- Types -------------------- */

// export interface SparePart {
//   _id: string;
//   organisationId: string;
//   code: string;
//   name: string;
//   equipmentLink?: string;
//   vendor?: string;
//   location?: string;
//   quantity: number;
//   unit: string;
//   reorderLevel: number;
//   costPerUnit: number;
//   critical?: boolean;
//   notes?: string;
//   isDeleted: boolean;
//   createdAt: string;
//   updatedAt: string;
// }

// interface SparePartState {
//   items: SparePart[];
//   loading: boolean;
//   error: string | null;
//   page: number;
//   totalPages: number;
//   total: number;
// }

// /* -------------------- Initial State -------------------- */

// const initialState: SparePartState = {
//   items: [],
//   loading: false,
//   error: null,
//   page: 1,
//   totalPages: 1,
//   total: 0,
// };

// /* -------------------- Async Thunks -------------------- */

// // Fetch spare parts (organisation + pagination)
// export const fetchSpareParts = createAsyncThunk(
//   "spareParts/fetch",
//   async (
//     {
//       organisationId,
//       page = 1,
//       limit = 10,
//     }: { organisationId: string; page?: number; limit?: number },
//     { rejectWithValue }
//   ) => {
//     try {
//       const res = await api.get(
//         `/spare-parts/${organisationId}?page=${page}&limit=${limit}`
//       );
//       return res.data;
//     } catch (err: any) {
//       return rejectWithValue(err.response?.data?.message);
//     }
//   }
// );

// // Create spare part
// export const createSparePart = createAsyncThunk(
//   "spareParts/create",
//   async ( payload: Partial<SparePart>, thunkAPI) => {
//     try {
//         ///api/spare-parts
//       const organisationId = localStorage.getItem("organisationId");
//       const res = await api.post(`/spare-parts/${organisationId}`, {
//         ...payload,
//         organisationId,
//       });
//       return res.data.data;
//     } catch (err: any) {
//        return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed");
//     }
//   }
// );

// // Update spare part
// export const updateSparePart = createAsyncThunk(
//   "spareParts/update",
//   async (
//     { id, data }: { id: string; data: Partial<SparePart> },
//     { rejectWithValue }
//   ) => {
//     try {
//       const res = await api.put(`/spare-parts/update/${id}`, data);
//       return res.data.data;
//     } catch (err: any) {
//       return rejectWithValue(err.response?.data?.message);
//     }
//   }
// );

// // Soft delete spare part
// export const deleteSparePart = createAsyncThunk(
//   "spareParts/delete",
//   async (id: string, { rejectWithValue }) => {
//     try {
//       await api.delete(`/spare-parts/delete/${id}`);
//       return id;
//     } catch (err: any) {
//       return rejectWithValue(err.response?.data?.message);
//     }
//   }
// );

// /* -------------------- Slice -------------------- */

// const sparePartsSlice = createSlice({
//   name: "spareParts",
//   initialState,
//   reducers: {
//     resetSpareParts: () => initialState,
//   },
//   extraReducers: (builder) => {
//     builder

//       // FETCH
//       .addCase(fetchSpareParts.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchSpareParts.fulfilled, (state, action) => {
//         state.loading = false;
//         state.items = action.payload.items;
//         state.page = action.payload.page;
//         state.totalPages = action.payload.totalPages;
//         state.total = action.payload.total;
//       })
//       .addCase(fetchSpareParts.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload as string;
//       })

//       // CREATE
//       .addCase(createSparePart.fulfilled, (state, action) => {
//         state.items.unshift(action.payload);
//       })

//       // UPDATE
//       .addCase(updateSparePart.fulfilled, (state, action) => {
//         state.items = state.items.map((item) =>
//           item._id === action.payload._id ? action.payload : item
//         );
//       })

//       // DELETE (SOFT)
//       .addCase(deleteSparePart.fulfilled, (state, action) => {
//         state.items = state.items.filter(
//           (item) => item._id !== action.payload
//         );
//       });
//   },
// });

// export const { resetSpareParts } = sparePartsSlice.actions;
// export default sparePartsSlice.reducer;
