import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

export interface RawMaterial {
  _id?: string;
  organisationId?: string;
  name: string;
  unit?: string;
  quantity?: number;
  location?: string | { _id: string; name: string };
  warehouse?: string | { _id: string; name: string };
  createdAt?: string;
  // Extended fields used in the component
  itemCode?: string;
  unitOfMeasure?: string;
  valuationMethod?: string;
  unitCost?: number;
  reorderLevel?: number;
  trackInventory?: boolean;
  hsn?: string;
  gstPercent?: number;
  technicalSpecs?: string;
  category?: string;
  // FIFO fields
  stocks?: Array<{
    warehouseId: string;
    quantity: number;
    unitCost: number;
    purchaseDate: string;
    batchId: string;

    gst?: {
      cgst?: number;
      sgst?: number;
      igst?: number;
    };
    documents?: {
      name: string;
      type: string;
      size: number;
      url: string;
      publicId: string;
    }[];


    totalCost?: number;

    purchaseOrderId?: string;
    movementId?: string;
    remainingQuantity: number;
  }>;

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
  "rawMaterials/fetch",
  async ({ page = 1, limit = 10, location = "", warehouse = "" }: { page: number; limit: number, location?: string, warehouse?: string }) => {
    const orgId = localStorage.getItem("organisationId");

    // Use warehouse parameter if provided, otherwise fall back to location for backward compatibility
    const filterParam = warehouse || location;
    const filterKey = warehouse ? "warehouse" : "location";

    const res = await api.get(
      `/raw/all/?page=${page}&limit=${limit}&${filterKey}=${filterParam}`,
      {
        headers: { organisationId: orgId },
      }
    );
    return res.data;
  }
);



export const addMaterial = createAsyncThunk(
  "raw/add",
  async (data: any, { rejectWithValue }) => {
    try {
      const res = await api.post("/raw/create", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
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
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      // Add the headers for multipart/form-data
      const res = await api.put(`/raw/update/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

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
  initialState: {
    materials: [],
    total: 0,
    page: 1,
    limit: 10,
    loading: false,
    error: null,
  }
  ,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMaterials.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchMaterials.fulfilled, (state, action) => {
        console.log("API RESPONSE:", action.payload);

        state.loading = false;
        state.materials = Array.isArray(action.payload?.materials)
          ? action.payload.materials
          : Array.isArray(action.payload)
            ? action.payload
            : [];

        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })

      .addCase(fetchMaterials.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
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
