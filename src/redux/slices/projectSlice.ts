import { BASE_URL } from "./../../utils/constants";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "@/utils/axiosApi";

export interface Project {
  _id: string;
  name: string;
  budget: number;
  actualCost: number;
  userId: string;

  // 🔽 ADD THESE (Lifecycle / Report fields)
  code?: string;
  status?: "planning" | "active" | "on-hold" | "completed" | "cancelled";

  projectCreatedAt?: string;
  projectClosedAt?: string | null;
  projectDurationInDays?: number | null;
}

export const updateProjectActualCost = createAsyncThunk(
  "projects/updateActualCost",
  async (
    { id, actualCost }: { id: string; actualCost: number },
    { rejectWithValue }
  ) => {
    try {
      await api.put(`/project/update-cost/${id}`, { actualCost });
      return { id, actualCost };
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Cost update failed"
      );
    }
  }
);


export const fetchProjects = createAsyncThunk(
  "projects/fetch",
  async (args: any, { rejectWithValue }) => {
    const { page, limit, status, search, location } = args;
    try {

      const organisationId = localStorage.getItem("organisationId");


      const res = await api.get(`/get/project`, {
        params: {
          organisationId,
          page,
          limit,
          status,
          search,
          location
        },
      });

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch projects."
      );
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
      const organisationId = localStorage.getItem("organisationId");
      const res = await api.post(`/create/project`, {
        ...data,
        organisationId, // attach userId to project
      });

      return res.data;
    } catch (error: any) {
      console.log(error);
      return rejectWithValue(
        error?.response?.data?.message || "Failed to create project."
      );
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
      const res = await api.put(`/project/update/${id}`, data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to update project."
      );
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
      await api.delete(`/project/delete/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to delete project."
      );
    }
  }
);

// -------------------------
// SLICE
// -------------------------
const projectsSlice = createSlice({
  name: "projects",
  initialState: {
    projects: [], // This will now hold only one page of projects
    loading: false,
    error: null,
    // Add new pagination state
    currentPage: 1,
    totalPages: 1,
    totalProjects: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projects = action.payload.projects; // ✅ Project[]
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalProjects = action.payload.totalProjects;
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
      })
      .addCase(updateProjectActualCost.fulfilled, (state, action) => {
        const { id, actualCost } = action.payload;
        const proj = state.projects.find((p) => p._id === id);
        if (proj) proj.actualCost = actualCost;
      });
  },
});

export default projectsSlice.reducer;
