import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// -------------------------
// FETCH PROJECTS
// -------------------------
export const fetchProjects = createAsyncThunk(
  "projects/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get("/api/get/project");
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || "Failed to fetch projects.");
    }
  }
);

// -------------------------
// ADD PROJECT
// -------------------------
export const addProject = createAsyncThunk(
  "projects/add",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axios.post("/api/create/project", data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || "Failed to create project.");
    }
  }
);

// -------------------------
// UPDATE PROJECT
// -------------------------
export const updateProject = createAsyncThunk(
  "projects/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`/api/project/update/${id}`, data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || "Failed to update project.");
    }
  }
);

// -------------------------
// DELETE PROJECT
// -------------------------
export const deleteProject = createAsyncThunk(
  "projects/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`/api/project/delete/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error?.response?.data?.message || "Failed to delete project.");
    }
  }
);

// -------------------------
// SLICE
// -------------------------
const projectsSlice = createSlice({
  name: "projects",
  initialState: {
    projects: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.projects = action.payload || [];
        state.loading = false;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as any;
      })

      // ADD
      .addCase(addProject.fulfilled, (state, action) => {
        if (action.payload) state.projects.push(action.payload);
      })
      .addCase(addProject.rejected, (state, action) => {
        state.error = action.payload as any;
      })

      // UPDATE
      .addCase(updateProject.fulfilled, (state, action) => {
        if (action.payload) {
          state.projects = state.projects.map((p) =>
            p._id === action.payload._id ? action.payload : p
          );
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.error = action.payload as any;
      })

      // DELETE
      .addCase(deleteProject.fulfilled, (state, action) => {
        if (action.payload) {
          state.projects = state.projects.filter(
            (p) => p._id !== action.payload
          );
        }
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.error = action.payload as any;
      });
  },
});

export default projectsSlice.reducer;
