"use client";

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";

/* TYPES */
export interface StoredFile {
  name: string;
  type: string;
  size: number;
  url: string;
  publicId: string;
}

export interface Equipment {
  _id?: string;
  id: string;
  code: string;
  name: string;
  model: string;
  category?: string;
  location?: string | any;
  manufacturer?: string;
  supplier?: string;
  warranty?: string;
  purchaseDate?: string;
  cost?: number;
  serialNumber?: string;
  department?: string;
  capacity?: string;
  frequency?: string;
  insurance?: string;
  depreciation?: string;
  documents?: StoredFile[];
  createdAt: string;

  // Quantity
  quantity?: number;

  // Pricing & GST
  basicCost?: number;
  cgst?: number;
  igst?: number;
  sgst?: number;
  totalCost?: number;
  invoiceNumber?: string;

  // Allocation tracking
  allocatedQuantity?: number;
  availableQuantity?: number;
  hasChildren?: boolean;

  // Parent-Child
  isParent?: boolean;
  parentId?: string;
  childIndex?: number;
  allocationStatus?: string;
  allocatedTo?: {
    projectName?: string;
    siteName?: string;
    startDate?: string;
    endDate?: string;
  };
}

/* STATE */
interface EquipmentState {
  equipments: Equipment[];
  pendingEquipment: any[]; // ✅ REQUIRED
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  search: string;
}


const initialState: EquipmentState = {
  equipments: [],
  pendingEquipment: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
  search: "",
};

/* API CALLS */

export const fetchEquipments = createAsyncThunk(
  "equipment/fetchEquipments",
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      location?: string;
    } = {},
    thunkAPI
  ) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      const res = await api.get("/equipment", {
        params: { ...params, organisationId }
      });
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data || "Failed to fetch equipment");
    }
  }
);

export const fetchPendingEquipmentRequests = createAsyncThunk(
  "equipment/fetchPending",
  async () => {
    const res = await api.get("/resource/pending/equipment");
    return res.data;
  }
);

export const approveEquipmentAllocation = createAsyncThunk(
  "equipment/approve",
  async (allocationId: string) => {
    await api.post("/equipment/handle-allocation", {
      allocationId,
      action: "APPROVED",
    });
    return allocationId;
  }
);

export const rejectEquipmentAllocation = createAsyncThunk(
  "equipment/reject",
  async ({ allocationId, reason }: { allocationId: string; reason: string }) => {
    await api.post("/equipment/handle-allocation", {
      allocationId,
      action: "REJECTED",
      rejectionReason: reason,
    });
    return allocationId;
  }
);

// CREATE
export const createEquipment = createAsyncThunk(
  "equipment/createEquipment",
  async (payload: any, thunkAPI) => {
    try {
      const organisationId = localStorage.getItem("organisationId") || "";

      let requestBody;
      let config = {};

      // Check if payload is FormData (File Uploads)
      if (payload instanceof FormData) {
        payload.append("organisationId", organisationId);
        requestBody = payload;
        // Axios automatically sets Content-Type to multipart/form-data when body is FormData
      }
      // Handle Plain JSON (Excel Imports)
      else {
        requestBody = {
          ...payload,
          organisationId,
        };
      }

      const res = await api.post("/equipment/create", requestBody, config);
      return res.data.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);
// UPDATE
export const updateEquipment = createAsyncThunk(
  "equipment/updateEquipment",
  async ({ id, data }: { id: string; data: Partial<Equipment> }, thunkAPI) => {
    try {
      const res = await api.put(`/equipment/${id}`, data);
      return res.data.data; // updated object with _id
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// DELETE
export const deleteEquipment = createAsyncThunk(
  "equipment/deleteEquipment",
  async (id: string, thunkAPI) => {
    try {
      await api.delete(`/equipment/delete/${id}`);
      return id;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);

// FETCH CHILDREN (for parent-child system)
export const fetchEquipmentChildren = createAsyncThunk(
  "equipment/fetchChildren",
  async (parentId: string, thunkAPI) => {
    try {
      const res = await api.get(`/equipment/children/${parentId}`);
      return { parentId, children: res.data.data };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch children");
    }
  }
);


/* SLICE */
const equipmentSlice = createSlice({
  name: "equipment",
  initialState,
  reducers: {
    setPage(state, action) {
      state.page = action.payload;
    },
    setLimit(state, action) {
      state.limit = action.payload;
    },
    setSearch(state, action) {
      state.search = action.payload;
      state.page = 1; // Reset to first page when searching
    },
  },

  extraReducers: (builder) => {
    /* FETCH */
    builder.addCase(fetchEquipments.pending, (state) => {
      state.loading = true;
    });

    builder.addCase(fetchEquipments.fulfilled, (state, action) => {
      state.loading = false;

      state.equipments = action.payload.data; // correct
      state.total = action.payload.pagination.total; // correct
      state.page = action.payload.pagination.page;
      state.limit = action.payload.pagination.limit;
    });
    builder.addCase(fetchPendingEquipmentRequests.fulfilled, (state, action) => {
      state.pendingEquipment = action.payload;
    });

    builder.addCase(approveEquipmentAllocation.fulfilled, (state, action) => {
      state.pendingEquipment = state.pendingEquipment.filter(
        (item) => item._id !== action.payload
      );
    });

    builder.addCase(rejectEquipmentAllocation.fulfilled, (state, action) => {
      state.pendingEquipment = state.pendingEquipment.filter(
        (item) => item._id !== action.payload
      );
    });



    builder.addCase(fetchEquipments.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    /* CREATE */
    builder.addCase(createEquipment.fulfilled, (state, action) => {
      state.equipments.unshift(action.payload);
      state.total += 1;
    });

    builder.addCase(updateEquipment.fulfilled, (state, action) => {
      const index = state.equipments.findIndex(
        (e) => e._id === action.payload._id
      );
      if (index !== -1) state.equipments[index] = action.payload;
    });

    // DELETE
    builder.addCase(deleteEquipment.fulfilled, (state, action) => {
      state.equipments = state.equipments.filter(
        (e) => e._id !== action.payload
      );
      state.total -= 1;
    });
  },
});

/* EXPORTS */
export const { setPage, setLimit, setSearch } = equipmentSlice.actions;
export default equipmentSlice.reducer;
