import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosApi from "@/utils/axiosApi";


export type CategoryForType =
  | "machinery"
  | "equipment"
  | "sparepart";

// fetch organisationId from localStorage
const getOrgId = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("organisationId");
  }
  return null;
};

// ---------- TYPES ----------
export type PlantMachineryMasterType = "category" | "supplier";

// ---------- API THUNKS ----------

// LIST (with pagination)
export const fetchPlantMachineryMaster = createAsyncThunk(
  "plantMachineryMaster/fetch",
  async (
    {
      type,
      categoryFor,
      page = 1,
      limit = 10,
    }: {
      type: PlantMachineryMasterType;
      categoryFor?: CategoryForType;
      page?: number;
      limit?: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const organisationId = getOrgId();

      let url = `/plant-machinery/${type}?page=${page}&limit=${limit}&organisationId=${organisationId}`;

      if (type === "category" && categoryFor) {
        url += `&categoryFor=${categoryFor}`;
      }

      const res = await axiosApi.get(url);

      return { type, categoryFor, data: res.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to fetch");
    }
  }
);


// CREATE
export const addPlantMachineryMaster = createAsyncThunk(
  "plantMachineryMaster/add",
  async (
    { type, data }: { type: PlantMachineryMasterType; data: any },
    { rejectWithValue }
  ) => {
    try {
      const organisationId = getOrgId();
      const payload = { ...data, type, organisationId };

      const res = await axiosApi.post("/plant-machinery", payload);

      return { type, data: res.data.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to create");
    }
  }
);

// UPDATE
export const updatePlantMachineryMaster = createAsyncThunk(
  "plantMachineryMaster/update",
  async (
    {
      id,
      type,
      data,
    }: { id: string; type: PlantMachineryMasterType; data: any },
    { rejectWithValue }
  ) => {
    try {
      const organisationId = getOrgId();
      const payload = { ...data, organisationId };

      const res = await axiosApi.put(`/plant-machinery/${id}`, payload);

      return { type, data: res.data.data };
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to update");
    }
  }
);

// DELETE
export const deletePlantMachineryMaster = createAsyncThunk(
  "plantMachineryMaster/delete",
  async (
    { id, type }: { id: string; type: PlantMachineryMasterType },
    { rejectWithValue }
  ) => {
    try {
      const organisationId = getOrgId();

      await axiosApi.delete(
        `/plant-machinery/${id}?organisationId=${organisationId}`
      );

      return { type, id };
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Failed to delete");
    }
  }
);

// ---------- STATE ----------
interface PaginationInfo {
  page: number;
  pages: number;
  total: number;
}

interface PlantMachineryMasterState {
  category: {
    machinery: any[];
    equipment: any[];
    sparepart: any[];
  };

  supplier: any[];

  pagination: {
    category: {
      machinery: PaginationInfo;
      equipment: PaginationInfo;
      sparepart: PaginationInfo;
    };
    supplier: PaginationInfo;
  };

  loading: boolean;
  error: string | null;
}

const initialState: PlantMachineryMasterState = {
  category: {
    machinery: [],
    equipment: [],
    sparepart: [],
  },

  supplier: [],

  pagination: {
    category: {
      machinery: { page: 1, pages: 1, total: 0 },
      equipment: { page: 1, pages: 1, total: 0 },
      sparepart: { page: 1, pages: 1, total: 0 },
    },
    supplier: { page: 1, pages: 1, total: 0 },
  },

  loading: false,
  error: null,
};

// ---------- SLICE ----------
const plantMachineryMasterSlice = createSlice({
  name: "plantMachineryMaster",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchPlantMachineryMaster.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPlantMachineryMaster.fulfilled, (state, action) => {
        state.loading = false;

        const { type, categoryFor, data } = action.payload;

        if (type === "category" && categoryFor) {
          state.category[categoryFor] = data.items;

          state.pagination.category[categoryFor] = {
            page: data.page,
            pages: data.pages,
            total: data.total,
          };
        }

        if (type === "supplier") {
          // If data.items exists, use it. Otherwise, if data itself is an array, use that.
          const supplierList = data.items || (Array.isArray(data) ? data : []);

          state.supplier = supplierList;

          // Only update pagination if the data supports it
          if (data.items) {
            state.pagination.supplier = {
              page: data.page,
              pages: data.pages,
              total: data.total,
            };
          }
        }
      })
      .addCase(fetchPlantMachineryMaster.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // CREATE
      .addCase(addPlantMachineryMaster.fulfilled, (state, action) => {
        const { type, data } = action.payload;

        if (type === "category") {
          state.category[data.categoryFor].unshift(data);
        }

        if (type === "supplier") {
          state.supplier.unshift(data);
        }
      })


      // UPDATE
      .addCase(updatePlantMachineryMaster.fulfilled, (state, action) => {
        const { type, data } = action.payload;

        if (type === "category") {
          state.category[data.categoryFor] =
            state.category[data.categoryFor].map((item) =>
              item._id === data._id ? data : item
            );
        }

        if (type === "supplier") {
          state.supplier = state.supplier.map((item) =>
            item._id === data._id ? data : item
          );
        }
      })


      // DELETE
      .addCase(deletePlantMachineryMaster.fulfilled, (state, action) => {
        const { type, id } = action.payload;

        if (type === "category") {
          Object.keys(state.category).forEach((key) => {
            state.category[key as CategoryForType] =
              state.category[key as CategoryForType].filter(
                (item) => item._id !== id
              );
          });
        }

        if (type === "supplier") {
          state.supplier = state.supplier.filter((item) => item._id !== id);
        }
      })

  },
});

export default plantMachineryMasterSlice.reducer;
