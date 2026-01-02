import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { RepairTeam } from "@/types/repair.types";

interface RepairTeamState {
  data: RepairTeam[];
  loading: boolean;
  error?: string;
}

const initialState: RepairTeamState = {
  data: [],
  loading: false,
};

export const fetchRepairTeams = createAsyncThunk(
  "repairTeams/fetch",
  async (location?: string) => {
    const res = await api.get("/repair-teams/fetch", {
      params: location ? { location } : {},
    });
    return res.data.data as RepairTeam[];
  }
);

export const createRepairTeam = createAsyncThunk(
  "repairTeams/create",
  async (payload: Partial<RepairTeam>) => {
    const res = await api.post("/repair-teams/create", payload);
    return res.data.data as RepairTeam;
  }
);

export const updateRepairTeam = createAsyncThunk(
  "repairTeams/update",
  async ({ id, data }: { id: string; data: Partial<RepairTeam> }) => {
    const res = await api.put(`/repair-teams/update/${id}`, data);
    return res.data.data as RepairTeam;
  }
);

export const deleteRepairTeam = createAsyncThunk(
  "repairTeams/delete",
  async (id: string) => {
    await api.delete(`/repair-teams/delete/${id}`);
    return id;
  }
);

const repairTeamSlice = createSlice({
  name: "repairTeams",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRepairTeams.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRepairTeams.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchRepairTeams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(createRepairTeam.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })

      .addCase(updateRepairTeam.fulfilled, (state, action) => {
        const index = state.data.findIndex(
          (t) => t._id === action.payload._id
        );
        if (index !== -1) state.data[index] = action.payload;
      })

      .addCase(deleteRepairTeam.fulfilled, (state, action) => {
        state.data = state.data.filter((t) => t._id !== action.payload);
      });
  },
});

export default repairTeamSlice.reducer;
