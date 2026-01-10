// redux/slices/teamSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";
import { toast } from "sonner";

/* ================= TYPES ================= */
interface FetchTeamsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface TeamMember {
  userId?: string;
  name: string;
  availability: string;
}

export interface Team {
  _id: string;
  teamName: string;
  teamLead: string;
  location?: string;
  productCategories: string[];
  contactInfo?: {
    email?: string;
    phone?: string;
  };
  members: TeamMember[];
}

/* ================= HELPERS ================= */

const getOrganisationId = () =>
  localStorage.getItem("organisationId");

/* ================= THUNKS ================= */

export const fetchTeams = createAsyncThunk<
  any,                 // return type (we'll improve later)
  FetchTeamsParams     // argument type
>(
  "teams/fetch",
  async ({ page = 1, limit = 10, search = "" }, { rejectWithValue }) => {
    try {
      const { data } = await axios.get("/fetch/team", {
        params: { page, limit, search },
      });
      return data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data);
    }
  }
);


export const createTeam = createAsyncThunk(
  "teams/create",
  async (payload: Partial<Team>, { rejectWithValue }) => {
    try {
      const { data } = await axios.post("/create/team", payload, {
        headers: {
          "x-organisation-id": getOrganisationId(),
        },
      });
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const updateTeam = createAsyncThunk(
  "teams/update",
  async ({ id, payload }: { id: string; payload: Partial<Team> }, { rejectWithValue }) => {
    try {
      const { data } = await axios.put(`/update/team/${id}`, payload, {
        headers: {
          "x-organisation-id": getOrganisationId(),
        },
      });
      return data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data);
    }
  }
);

export const deleteTeam = createAsyncThunk(
  "teams/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/delete/team/${id}`, {
        headers: {
          "x-organisation-id": getOrganisationId(),
        },
      });
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data);
    }
  }
);

/* ================= SLICE ================= */

interface TeamState {
  teams: Team[];
  loading: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
}

const initialState: TeamState = {
  teams: [],
  loading: false,
  pagination: null,
};

const teamSlice = createSlice({
  name: "teams",
  initialState,
  reducers: {
    clearTeams: (state) => {
      state.teams = [];
      state.pagination = null;
    },
  },
  extraReducers: (builder) => {
    builder

      /* ===== FETCH ===== */
      .addCase(fetchTeams.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.loading = false;
        state.teams = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchTeams.rejected, (state, action: any) => {
        state.loading = false;
        toast.error(action.payload?.message || "Failed to fetch teams");
      })

      /* ===== CREATE ===== */
      .addCase(createTeam.pending, (state) => {
        state.loading = true;
        toast.loading("Creating team...", { id: "create-team" });
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        state.loading = false;
        toast.success("Team created successfully", { id: "create-team" });
        state.teams.unshift(action.payload);
      })
      .addCase(createTeam.rejected, (state, action: any) => {
        state.loading = false;
        toast.error(action.payload?.message || "Failed to create team", {
          id: "create-team",
        });
      })

      /* ===== UPDATE ===== */
      .addCase(updateTeam.pending, (state) => {
        state.loading = true;
        toast.loading("Updating team...", { id: "update-team" });
      })
      .addCase(updateTeam.fulfilled, (state, action) => {
        state.loading = false;
        toast.success("Team updated successfully", { id: "update-team" });

        const index = state.teams.findIndex(
          (t) => t._id === action.payload._id
        );
        if (index !== -1) state.teams[index] = action.payload;
      })
      .addCase(updateTeam.rejected, (state, action: any) => {
        state.loading = false;
        toast.error(action.payload?.message || "Failed to update team", {
          id: "update-team",
        });
      })

      /* ===== DELETE ===== */
      .addCase(deleteTeam.pending, (state) => {
        state.loading = true;
        toast.loading("Deleting team...", { id: "delete-team" });
      })
      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.loading = false;
        toast.success("Team deleted successfully", { id: "delete-team" });
        state.teams = state.teams.filter(
          (t) => t._id !== action.payload
        );
      })
      .addCase(deleteTeam.rejected, (state, action: any) => {
        state.loading = false;
        toast.error(action.payload?.message || "Failed to delete team", {
          id: "delete-team",
        });
      });
  },
});

export const { clearTeams } = teamSlice.actions;
export default teamSlice.reducer;
