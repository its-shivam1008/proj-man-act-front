import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = "http://localhost:4000/resources";

// read userId from localStorage
const getUserId = () => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  return JSON.parse(raw)._id;
};

// -------------------------
//  FETCH ALL BY PROJECT
// -------------------------
export const fetchResources = createAsyncThunk(
  "resources/fetchResources",
  async (projectId: string, { rejectWithValue }) => {
    try {
      const userId = getUserId();
      if (!userId) return rejectWithValue("User not logged in");

      const res = await axios.get(
        `${API}/project/${projectId}?userId=${userId}`
      );

      return res.data;
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
  async (data: any, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API}/create`, data);
      return res.data;
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
    { id, data }: { id: string; data: any },
    { rejectWithValue }
  ) => {
    try {
      const res = await axios.put(`${API}/update/${id}`, data);
      return res.data;
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
      await axios.delete(`${API}/delete/${id}`);
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
  resources: any[];
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
    builder.addCase(addResource.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(addResource.fulfilled, (state, action) => {
      state.loading = false;
      state.resources.unshift(action.payload);
    });
    builder.addCase(addResource.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // UPDATE
    builder.addCase(updateResource.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(updateResource.fulfilled, (state, action) => {
      state.loading = false;
      state.resources = state.resources.map((item) =>
        item._id === action.payload._id ? action.payload : item
      );
    });
    builder.addCase(updateResource.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // DELETE
    builder.addCase(deleteResource.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(deleteResource.fulfilled, (state, action) => {
      state.loading = false;
      state.resources = state.resources.filter(
        (item) => item._id !== action.payload
      );
    });
    builder.addCase(deleteResource.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export default resourceSlice.reducer;
