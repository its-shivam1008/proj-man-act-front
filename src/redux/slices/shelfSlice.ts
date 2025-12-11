import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";

export const createShelf = createAsyncThunk(
  "shelf/createShelf",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/shelf/create", data);
      return res.data.shelf;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchShelves = createAsyncThunk(
  "shelves/fetchShelves",
  async (rackId: string, thunkAPI) => {
    try {
      console.log("📌 fetchShelves CALLED with rackId:", rackId);

      const url = `/shelf/get/${rackId}`;
      console.log("🌍 API URL:", url);

      const res = await api.get(url);

      console.log("🟩 SHELVES API RESPONSE:", res.data);

      return res.data;
    } catch (error: any) {
      console.log("❌ ERROR in fetchShelves:", error?.response?.data || error.message);
      return thunkAPI.rejectWithValue(error?.response?.data || "Shelf fetch failed");
    }
  }
);

const shelfSlice = createSlice({
  name: "shelf",
  initialState: { shelves: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createShelf.pending, (state) => {
        state.loading = true;
      })
      .addCase(createShelf.fulfilled, (state, action) => {
        state.loading = false;
        state.shelves.push(action.payload);
      })
      .addCase(createShelf.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchShelves.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchShelves.fulfilled, (state, action) => {
        state.loading = false;
        state.shelves = action.payload.shelves;
      })
      .addCase(fetchShelves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default shelfSlice.reducer;
