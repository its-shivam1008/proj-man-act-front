import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";

export interface ResourceAllocation {
  _id: string;
  projectId: string;
  wbsId: string;
  wbsName: string;
  resourceType: "manpower" | "material" | "equipment";
  resourceId: string;
  resourceName: string;
  quantity: number;
  rate: number;
  unit: string;
  duration: number;
  durationUnit: string;
  totalCost: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

const RESOURCE_BASE = "/resource";

// -------------------------
//  FETCH ALL BY PROJECT
// -------------------------
export const fetchResources = createAsyncThunk(
  "resources/fetchResources",
  async (projectId: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`${RESOURCE_BASE}/project/${projectId}`);
      return res.data as ResourceAllocation[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

// -------------------------
//  CREATE
// -------------------------
export const addResource = createAsyncThunk(
  "resources/addResource",
  async (data: Partial<ResourceAllocation>, { rejectWithValue }) => {
    try {
      const res = await api.post(`${RESOURCE_BASE}/create`, data);
      return res.data as ResourceAllocation;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

// -------------------------
//  UPDATE
// -------------------------
export const updateResource = createAsyncThunk(
  "resources/updateResource",
  async (
    { id, data }: { id: string; data: Partial<ResourceAllocation> },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.put(`${RESOURCE_BASE}/update/${id}`, data);
      return res.data as ResourceAllocation;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

// -------------------------
//  DELETE
// -------------------------
export const deleteResource = createAsyncThunk(
  "resources/deleteResource",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`${RESOURCE_BASE}/delete/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

// -------------------------
//  SLICE
// -------------------------
interface ResourceState {
  resources: ResourceAllocation[];
  loading: boolean;
  error: string | null;
}

const initialState: ResourceState = {
  resources: [],
  loading: false,
  error: null,
};

const resourceSlice = createSlice({
  name: "resources",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    // FETCH
    builder.addCase(fetchResources.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchResources.fulfilled, (state, action) => {
      state.loading = false;
      state.resources = action.payload;
    });
    builder.addCase(fetchResources.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // CREATE
    builder.addCase(addResource.fulfilled, (state, action) => {
      state.resources.unshift(action.payload);
    });
    builder.addCase(addResource.rejected, (state, action) => {
      state.error = action.payload as string;
    });

    // UPDATE
    builder.addCase(updateResource.fulfilled, (state, action) => {
      state.resources = state.resources.map((item) =>
        item._id === action.payload._id ? action.payload : item
      );
    });
    builder.addCase(updateResource.rejected, (state, action) => {
      state.error = action.payload as string;
    });

    // DELETE
    builder.addCase(deleteResource.fulfilled, (state, action) => {
      state.resources = state.resources.filter(
        (item) => item._id !== action.payload
      );
    });
    builder.addCase(deleteResource.rejected, (state, action) => {
      state.error = action.payload as string;
    });
  },
});

export default resourceSlice.reducer;
