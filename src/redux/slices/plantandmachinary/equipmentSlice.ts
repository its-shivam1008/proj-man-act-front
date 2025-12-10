import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";

export type DepreciationMethod = "Straight-line" | "WDV";
export type MaintenanceFrequency = "Monthly" | "Quarterly" | "Yearly";

export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface Equipment {
  _id: string;
  organisationId: string;
  code: string;
  name: string;
  model: string;
  manufacturer?: string;
  // location?: string;
  supplier?: string;
  warranty?: string;
  purchaseDate?: string;
  cost?: number;
  category?: string;
  serialNumber?: string;
  location?: string;
  department?: string;
  capacity?: string;
  frequency?: MaintenanceFrequency;
  insurance?: string;
  depreciation?: DepreciationMethod;
  documents?: StoredFile[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface EquipmentState {
  equipments: Equipment[];
  loading: boolean;
  currentPage: number;
  limit: number;
  totalPages: number;
  totalEquipments: number;
  error: string | null;
}

const initialState: EquipmentState = {
  equipments: [],
  loading: false,

  currentPage: 1,
  limit: 10,
  totalPages: 1,
  totalEquipments: 0,

  error: null,
};
export const fetchEquipments = createAsyncThunk(
  "equipment/fetchEquipments",
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      category?: string;
      location?: string;
      organisationId: string;
    },
    thunkAPI
  ) => {
    try {
      const res = await api.get("/equipment", { params });
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data || "Failed to fetch equipment");
    }
  }
);
export const addEquipment = createAsyncThunk(
  "equipment/addEquipment",
  async (data: Partial<Equipment>, thunkAPI) => {
    try {
      const res = await api.post("/equipment", data);
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data || "Failed to add equipment");
    }
  }
);
export const updateEquipment = createAsyncThunk(
  "equipment/updateEquipment",
  async ({ id, data }: { id: string; data: Partial<Equipment> }, thunkAPI) => {
    try {
      const res = await api.put(`/equipment/${id}`, data);
      return res.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data || "Failed to update equipment");
    }
  }
);
export const deleteEquipment = createAsyncThunk(
  "equipment/deleteEquipment",
  async (id: string, thunkAPI) => {
    try {
      await api.delete(`/equipment/${id}`);
      return { id };
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data || "Failed to delete equipment");
    }
  }
);
const equipmentSlice = createSlice({
  name: "equipment",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchEquipments.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchEquipments.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;

        state.equipments = action.payload.data;

        const p = action.payload.pagination;
        if (p) {
          state.currentPage = p.page;
          state.limit = p.limit;
          state.totalPages = p.totalPages;
          state.totalEquipments = p.total;
        }
      })

      .addCase(fetchEquipments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addEquipment.fulfilled, (state, action) => {
        state.equipments.unshift(action.payload.data);
      })

      .addCase(updateEquipment.fulfilled, (state, action) => {
        const updated = action.payload.data;
        state.equipments = state.equipments.map((e) =>
          e._id === updated._id ? updated : e
        );
      })
      .addCase(deleteEquipment.fulfilled, (state, action) => {
        state.equipments = state.equipments.filter((e) => e._id !== action.payload.id);
      });
  },
});

export default equipmentSlice.reducer;
