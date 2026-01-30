"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";

/* TYPES */
export interface StoredFile {
  id?: string; // Add ID for local management
  name: string;
  type: string;
  size: number;
  url: string;
  publicId?: string;
  rawFile?: File; // <--- ADD THIS: To store the actual file for upload
}

export interface Machinery {
  _id?: string;
  id: string;
  code: string;
  name: string;
  category?: string;
  location?: string;
  manufacturer?: string;
  supplier?: string;
  warranty?: string;
  purchaseDate?: string;
  cost?: number;
  quantity?: number;
  unitCost?: number;
  totalAmount?: number;
  serialNumber?: string;
  department?: string;
  capacity?: string;
  powerRating?: string;
  operatingHours?: number;
  frequency?: string;
  insurance?: string;
  depreciation?: string;
  status?: string;
  documents?: StoredFile[];
  createdAt: string;

  // Pricing & GST
  basicCost?: number;
  cgst?: number;
  igst?: number;
  sgst?: number;
  totalCost?: number;
  invoiceNumber?: string;

  // Insurance & Compliance dates
  insuranceDate?: string;
  insuranceExpiry?: string;
  puDate?: string;
  puDateExpiry?: string;
  vTaxPayment?: number;

  // Allocation tracking
  allocatedQuantity?: number;
  availableQuantity?: number;
  hasChildren?: boolean;

  // Parent-Child System
  isParent?: boolean;
  parentId?: string;
  childIndex?: number;
  allocationStatus?: "available" | "allocated";
  allocatedTo?: {
    projectName?: string;
    siteName?: string;
    startDate?: string;
    endDate?: string;
  };
}

/* STATE */
interface MachineryState {
  machineries: Machinery[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
}

const initialState: MachineryState = {
  machineries: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
};

/* API CALLS */

// FETCH WITH PAGINATION
export const fetchMachineries = createAsyncThunk(
  "machinery/fetchMachineries",
  async (
    // [!code ++] Add location
    { page = 1, limit = 10, location }: { page: number; limit: number; location?: string },
    thunkAPI
  ) => {
    try {
      const organisationId = localStorage.getItem("organisationId");

      // [!code ++] Add location param
      const res = await api.get(
        `/machinery?page=${page}&limit=${limit}&organisationId=${organisationId}&location=${location || ""}`
      );

      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// CREATE
export const createMachinery = createAsyncThunk(
  "machinery/createMachinery",
  async (payload: Partial<Machinery>, thunkAPI) => {
    try {
      const organisationId = localStorage.getItem("organisationId");

      const fd = new FormData();

      Object.entries(payload).forEach(([key, value]) => {
        if (key === "documents" && Array.isArray(value)) {
          value.forEach((doc) => {
            if (doc.rawFile) {
              fd.append("documents", doc.rawFile);
            }
          });
        } else if (value !== undefined && value !== null) {
          fd.append(key, String(value));
        }
      });

      fd.append("organisationId", organisationId || "");

      const res = await api.post("/machinery/create", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return res.data.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// UPDATE
export const updateMachinery = createAsyncThunk(
  "machinery/updateMachinery",
  async ({ id, data }: { id: string; data: Partial<Machinery> }, thunkAPI) => {
    try {
      const fd = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (key === "documents" && Array.isArray(value)) {
          value.forEach((doc) => {
            if (doc.rawFile) {
              fd.append("documents", doc.rawFile);
            }
          });
        } else if (value !== undefined && value !== null) {
          fd.append(key, String(value));
        }
      });

      const res = await api.put(`/machinery/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return res.data.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// DELETE
export const deleteMachinery = createAsyncThunk(
  "machinery/deleteMachinery",
  async (id: string, thunkAPI) => {
    try {
      await api.delete(`/machinery/delete/${id}`);
      return id;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// FETCH CHILDREN (for parent-child system)
export const fetchMachineryChildren = createAsyncThunk(
  "machinery/fetchChildren",
  async (parentId: string, thunkAPI) => {
    try {
      const res = await api.get(`/machinery/children/${parentId}`);
      return { parentId, children: res.data.data };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch children");
    }
  }
);


/* SLICE */
const machinerySlice = createSlice({
  name: "machinery",
  initialState,
  reducers: {
    setPage(state, action) {
      state.page = action.payload;
    },
    setLimit(state, action) {
      state.limit = action.payload;
    },
  },

  extraReducers: (builder) => {
    /* FETCH */
    builder.addCase(fetchMachineries.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(fetchMachineries.fulfilled, (state, action) => {
      state.loading = false;

      state.machineries = action.payload.data;
      state.total = action.payload.pagination.total;
      state.page = action.payload.pagination.page;
      state.limit = action.payload.pagination.limit;
    });

    builder.addCase(fetchMachineries.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    /* CREATE */
    builder.addCase(createMachinery.fulfilled, (state, action) => {
      state.machineries.unshift(action.payload);
      state.total += 1;
    });

    builder.addCase(updateMachinery.fulfilled, (state, action) => {
      const index = state.machineries.findIndex(
        (e) => e._id === action.payload._id
      );
      if (index !== -1) state.machineries[index] = action.payload;
    });

    // DELETE
    builder.addCase(deleteMachinery.fulfilled, (state, action) => {
      state.machineries = state.machineries.filter(
        (e) => e._id !== action.payload
      );
      state.total -= 1;
    });
  },
});

/* EXPORTS */
export const { setPage, setLimit } = machinerySlice.actions;
export default machinerySlice.reducer;
