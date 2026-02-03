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
  approvalStatus?: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;

}

const RESOURCE_BASE = "/resource";

// -------------------------
//  FETCH ALL BY PROJECT
// -------------------------
export const fetchResources = createAsyncThunk(
  "resources/fetch",
  async ({ projectId, search = "" }) => {
    const res = await api.get(`/resource/project/${projectId}?search=${search}`);
    return res.data;
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
export const fetchPendingMachineryRequests = createAsyncThunk(
  "resource/fetchPendingMachineryRequests",
  async (_, thunkAPI) => {
    try {
      const res = await api.get("/resource/pending/machinery");
      return res.data; // Return res.data directly, NOT res.data.data
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed");
    }
  }
);
export const approveResourceAllocation = createAsyncThunk(
  "resource/approve",
  async (allocationId: string) => {
    // The machinery controller expects 'action: "APPROVED"'
    const response = await api.post(`/machinery/handle-allocation`, { 
      allocationId, 
      action: "APPROVED" 
    });
    return allocationId;
  }
);
export const rejectResourceAllocation = createAsyncThunk(
  "resource/rejectAllocation",
  async ({ allocationId, reason }: { allocationId: string; reason: string }, thunkAPI) => {
    try {
      // [!code --] REMOVE THIS: await api.put(`/resource/reject/${allocationId}`, { reason });
      // [!code ++] ADD THIS:
      await api.post(`/machinery/handle-allocation`, {
        allocationId,
        action: "REJECTED",
        rejectionReason: reason
      });
      return allocationId;
    } catch (err: any) {
      return thunkAPI.rejectWithValue("Rejection failed");
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
  pendingMachinery: ResourceAllocation[];
  loading: boolean;
  error: string | null;
}

const initialState: ResourceState = {
  resources: [],
  pendingMachinery: [],
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
    })
    // FETCH PENDING MACHINERY
    builder.addCase(fetchPendingMachineryRequests.fulfilled, (state, action) => {
      state.pendingMachinery = action.payload;
    })
    builder.addCase(approveResourceAllocation.fulfilled, (state, action) => {
      state.pendingMachinery = state.pendingMachinery.filter(
        (item) => item._id !== action.payload
      );
    });

    builder.addCase(rejectResourceAllocation.fulfilled, (state, action) => {
      state.pendingMachinery = state.pendingMachinery.filter(
        (item) => item._id !== action.payload
      );
    });
  },
});

export default resourceSlice.reducer;
