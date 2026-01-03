import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import {
  QualityTeam,
  CreateQualityTeamData,
  UpdateQualityTeamData,
  QualityTeamFilters,
} from "@/types/quality.types";

interface QualityTeamState {
  qualityTeams: QualityTeam[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalTeams: number;
}

const initialState: QualityTeamState = {
  qualityTeams: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalTeams: 0,
};

// Fetch Quality Teams
export const fetchQualityTeams = createAsyncThunk(
  "qualityTeams/fetch",
  async (args: QualityTeamFilters, { rejectWithValue }) => {
    const { page, limit, department, isActive, search, location } = args;
    try {
      const organisationId = localStorage.getItem("organisationId");

      const res = await api.get(`/api/quality/get/quality-teams`, {
        params: {
          organisationId,
          page,
          limit,
          department,
          isActive,
          search,
          location,
        },
      });

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch quality teams."
      );
    }
  }
);

// Add Quality Team
export const addQualityTeam = createAsyncThunk(
  "qualityTeams/add",
  async (data: CreateQualityTeamData, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      const res = await api.post(`/api/quality/create/quality-team`, {
        ...data,
        organisationId,
      });

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to create quality team."
      );
    }
  }
);

// Update Quality Team
export const updateQualityTeam = createAsyncThunk(
  "qualityTeams/update",
  async ({ id, data }: { id: string; data: UpdateQualityTeamData }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/quality/quality-team/update/${id}`, data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to update quality team."
      );
    }
  }
);

// Delete Quality Team
export const deleteQualityTeam = createAsyncThunk(
  "qualityTeams/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/api/quality/quality-team/delete/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to delete quality team."
      );
    }
  }
);

// Get Quality Team by ID
export const getQualityTeamById = createAsyncThunk(
  "qualityTeams/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/quality/quality-team/${id}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch quality team."
      );
    }
  }
);

const qualityTeamSlice = createSlice({
  name: "qualityTeams",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchQualityTeams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQualityTeams.fulfilled, (state, action) => {
        state.loading = false;
        state.qualityTeams = action.payload.qualityTeams;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalTeams = action.payload.totalTeams;
      })
      .addCase(fetchQualityTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ADD
      .addCase(addQualityTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addQualityTeam.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.qualityTeams.unshift(action.payload);
          state.totalTeams += 1;
        }
      })
      .addCase(addQualityTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // UPDATE
      .addCase(updateQualityTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQualityTeam.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.qualityTeams = state.qualityTeams.map((team) =>
            team._id === action.payload._id ? action.payload : team
          );
        }
      })
      .addCase(updateQualityTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // DELETE
      .addCase(deleteQualityTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQualityTeam.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.qualityTeams = state.qualityTeams.filter(
            (team) => team._id !== action.payload
          );
          state.totalTeams -= 1;
        }
      })
      .addCase(deleteQualityTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // GET BY ID
      .addCase(getQualityTeamById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQualityTeamById.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(getQualityTeamById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = qualityTeamSlice.actions;
export default qualityTeamSlice.reducer;