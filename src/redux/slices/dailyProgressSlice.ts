import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { DailyProgressItem } from "../../types/dailyProgress";
import { BASE_URL } from "@/utils/constants";
import api from "@/utils/axiosApi";

export const fetchDailyProgress = createAsyncThunk(
  "dailyProgress/fetchAll",
  async () => {
    const res = await api.get(BASE_URL + "/get/all/daily/progress");
    return res.data.data as DailyProgressItem[];
  }
);

// CREATE
export const addDailyProgress = createAsyncThunk(
  "dailyProgress/add",
  async (payload: DailyProgressItem) => {
    const res = await api.post(BASE_URL + "/create/daily/progress", payload);
    return res.data.data as DailyProgressItem;
  }
);

// UPDATE
export const editDailyProgress = createAsyncThunk(
  "dailyProgress/edit",
  async ({
    id,
    payload,
  }: {
    id: string;
    payload: Partial<DailyProgressItem>;
  }) => {
    const res = await api.put(BASE_URL + "/daily/progress/update/" + id, payload);
    return res.data.data as DailyProgressItem;
  }
);

// DELETE
export const removeDailyProgress = createAsyncThunk(
  "dailyProgress/delete",
  async (id: string) => {
    await api.delete(BASE_URL + "/daily/progress/delete/" + id);
    return id;
  }
);

// ------------------------------------
// Slice
// ------------------------------------
interface DailyProgressState {
  items: DailyProgressItem[];
  loading: boolean;
}

const initialState: DailyProgressState = {
  items: [],
  loading: false,
};

const dailyProgressSlice = createSlice({
  name: "dailyProgress",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchDailyProgress.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchDailyProgress.fulfilled,
        (state, action: PayloadAction<DailyProgressItem[]>) => {
          state.loading = false;
          state.items = action.payload;
        }
      )

      // Add
      .addCase(
        addDailyProgress.fulfilled,
        (state, action: PayloadAction<DailyProgressItem>) => {
          state.items.push(action.payload);
        }
      )

      // Edit
      .addCase(
        editDailyProgress.fulfilled,
        (state, action: PayloadAction<DailyProgressItem>) => {
          const index = state.items.findIndex(
            (item) => item._id === action.payload._id
          );
          if (index !== -1) state.items[index] = action.payload;
        }
      )

      // Delete
      .addCase(
        removeDailyProgress.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.items = state.items.filter((p) => p._id !== action.payload);
        }
      );
  },
});

export default dailyProgressSlice.reducer;
