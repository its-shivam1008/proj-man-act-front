import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

export interface RawMaterial {
  _id: string;
  organisationId: string;
  name: string;
  unit: string;
  quantity: number;
  createdAt: string;
}

export interface RawMaterialState {
  materials: RawMaterial[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalMaterials: number;
}

const initialState: RawMaterialState = {
  materials: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalMaterials: 0,
};

export const fetchMaterials = createAsyncThunk(
  "raw/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      if (!organisationId) return rejectWithValue("No organisationId found");

      const res = await api.get(`/raw/all/`, {
        headers: { organisationid: organisationId },
      });

      return res.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || "Failed to fetch materials");
    }
  }
);


export const addMaterial = createAsyncThunk(
  "raw/add",
  async (data: Partial<RawMaterial>, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");

      const res = await api.post("/raw/craete/", {
        ...data,
        organisationId,
      });

      toast.success("Material added successfully");
      return res.data.material;
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to add material";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const updateMaterial = createAsyncThunk(
  "raw/update",
  async (
    { id, data }: { id: string; data: Partial<RawMaterial> },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/raw/update/${id}`, data);
      toast.success("Material updated successfully");
      return res.data.material;
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to update material";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);


export const deleteMaterial = createAsyncThunk(
  "raw/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/raw/delete/${id}`);
      toast.success("Material deleted");
      return id;
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Failed to delete material";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);


const rawMaterialSlice = createSlice({
  name: "rawMaterials",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaterials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaterials.fulfilled, (state, action) => {
        state.loading = false;

        state.materials = action.payload.materials || [];
        state.currentPage = action.payload.currentPage || 1;
        state.totalPages = action.payload.totalPages || 1;
        state.totalMaterials = action.payload.totalMaterials || state.materials.length;
      })
      .addCase(fetchMaterials.rejected, (state, action) => {
        state.loading = false;

        if (action.payload !== "No organisationId found") {
          state.error = action.payload as string;
        } else {
          state.materials = [];
        }
      })

      .addCase(addMaterial.fulfilled, (state, action) => {
        state.materials.push(action.payload);
      })

      .addCase(updateMaterial.fulfilled, (state, action) => {
        const index = state.materials.findIndex((m) => m._id === action.payload._id);
        if (index !== -1) state.materials[index] = action.payload;
      })

      .addCase(deleteMaterial.fulfilled, (state, action) => {
        state.materials = state.materials.filter((m) => m._id !== action.payload);
      });
  },
});

export default rawMaterialSlice.reducer;
