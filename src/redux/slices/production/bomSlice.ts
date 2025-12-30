import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi"
/* =========================
   TYPES
========================= */
export interface BOMItem {
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  cost?: number;
}

export interface BOM {
  _id: string;
  productId: string;
  productName: string;
  version: string;
  status: "draft" | "active" | "inactive";
  location?: string;
  items: BOMItem[];
  createdAt: string;
  updatedAt: string;
}

interface BOMState {
  list: BOM[];
  selected: BOM | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/* =========================
   INITIAL STATE
========================= */
const initialState: BOMState = {
  list: [],
  selected: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 0,
    currentPage: 1,
    totalItems: 0,
    itemsPerPage: 5,
  },
};

/* =========================
   THUNKS (CRUD)
========================= */

// 🔹 GET BOMs (pagination)
export const fetchBOMs = createAsyncThunk(
  "bom/fetchBOMs",
  async ({ page = 1, limit = 10, search = "", location }: any, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");

      if (!organisationId) throw new Error("organisationId missing");

      const params: any = { page, limit, search };
      
      // Add location parameter if provided and not "all"
      if (location && location !== "all") {
        params.location = location;
      }

      const res = await axios.get("/bom/get/bom", {
        params,
        headers: {
          "organisationid": organisationId // Add this line
        }
      });

      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Fetch failed");
    }
  }
);


// 🔹 GET SINGLE BOM
export const fetchBOMById = createAsyncThunk(
  "bom/fetchBOMById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axios.get(`/bom/single/${id}`);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Fetch failed");
    }
  }
);

// 🔹 CREATE BOM
export const createBOM = createAsyncThunk(
  "bom/createBOM",
  async (payload: Partial<BOM>, { rejectWithValue }) => {
    try {
      const res = await axios.post("/boms/create", payload);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Create failed");
    }
  }
);

/* ===== UPDATE BOM ===== */
export const updateBOM = createAsyncThunk(
  "bom/updateBOM",
  async ({ id, data }: { id: string; data: Partial<BOM> }, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      const res = await axios.put(`/bom/update/${id}`, data, {
        headers: { organisationid: organisationId } // Standardize headers
      });
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Update failed");
    }
  }
);

/* ===== DELETE BOM ===== */
export const deleteBOM = createAsyncThunk(
  "bom/deleteBOM",
  async (id: string, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      await axios.delete(`/bom/delete/${id}`, {
        headers: { organisationid: organisationId } // REQUIRED by your controller
      });
      return id; // Return the ID to remove it from the state
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Delete failed");
    }
  }
);

/* =========================
   SLICE
========================= */
const bomSlice = createSlice({
  name: "bom",
  initialState,
  reducers: {
    clearSelectedBOM(state) {
      state.selected = null;
    },
  },
  extraReducers: (builder) => {
    builder

      /* ===== FETCH LIST ===== */
      .addCase(fetchBOMs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBOMs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data || [];
        const paginationData = action.payload.pagination;
        state.pagination = {
          total: paginationData?.total || 0,
          page: paginationData?.page || 1,
          limit: paginationData?.limit || 5,
          totalPages: paginationData?.totalPages || 0,
          currentPage: paginationData?.page || 1,
          totalItems: paginationData?.total || 0,
          itemsPerPage: paginationData?.limit || 5,
        };
      })
      .addCase(fetchBOMs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* ===== FETCH SINGLE ===== */
      .addCase(fetchBOMById.fulfilled, (state, action: PayloadAction<BOM>) => {
        state.selected = action.payload;
      })

      /* ===== CREATE ===== */
      .addCase(createBOM.fulfilled, (state, action: PayloadAction<BOM>) => {
        state.list.unshift(action.payload);
      })

      /* ===== UPDATE ===== */
      .addCase(updateBOM.fulfilled, (state, action: PayloadAction<BOM>) => {
        const index = state.list.findIndex(
          (b) => b._id === action.payload._id
        );
        if (index !== -1) state.list[index] = action.payload;
        if (state.selected?._id === action.payload._id) {
          state.selected = action.payload;
        }
      })

      /* ===== DELETE ===== */
      .addCase(deleteBOM.fulfilled, (state, action: PayloadAction<string>) => {
        state.list = state.list.filter((b) => b._id !== action.payload);
      });
  },
});

export const { clearSelectedBOM } = bomSlice.actions;
export default bomSlice.reducer;
