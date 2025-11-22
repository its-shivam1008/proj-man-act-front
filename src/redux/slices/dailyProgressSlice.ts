import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";

interface DailyProgressState {
  items: any[];
  loading: boolean;
  error: string | null;
}

const initialState: DailyProgressState = {
  items: [],
  loading: false,
  error: null,
};


export const fetchDailyProgress = createAsyncThunk(
  "dailyProgress/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");

      const res = await api.get("/get/all/daily/progress", {
        params: { organisationId },
      });

      return res.data.data || [];
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Fetch failed");
    }
  }
);

export const addDailyProgress = createAsyncThunk(
  "dailyProgress/add",
  async (payload: any, { rejectWithValue }) => {
    try {
      const res = await api.post("/create/daily/progress", payload);
      return res.data.data;
    } catch (err: any) {
      console.error(err, "error");
      return rejectWithValue(err.response?.data || "Create failed");
    }
  }
);

export const editDailyProgress = createAsyncThunk(
  "dailyProgress/edit",
  async (
    { id, payload }: { id: string; payload: any },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/daily/progress/update/${id}`, payload);
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Update failed");
    }
  }
);

// -----------------------------
// DELETE
// -----------------------------
export const removeDailyProgress = createAsyncThunk(
  "dailyProgress/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/daily/progress/delete/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || "Delete failed");
    }
  }
);

// -----------------------------
// SLICE
// -----------------------------
const dailyProgressSlice = createSlice({
  name: "dailyProgress",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchDailyProgress.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDailyProgress.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchDailyProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.items = [];
      })

      // ADD
      .addCase(addDailyProgress.fulfilled, (state, action) => {
        if (action.payload) state.items.push(action.payload);
      })

      // EDIT
      .addCase(editDailyProgress.fulfilled, (state, action) => {
        state.items = state.items.map((it) =>
          it._id === action.payload._id ? action.payload : it
        );
      })

      // DELETE
      .addCase(removeDailyProgress.fulfilled, (state, action) => {
        state.items = state.items.filter((it) => it._id !== action.payload);
      });
  },
});

export default dailyProgressSlice.reducer;
