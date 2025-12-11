import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";

export const createRack = createAsyncThunk(
  "rack/createRack",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post("/rack", data);
      return res.data.rack;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchRacks = createAsyncThunk(
  "rack/fetchRacks",
  async (warehouseId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/rack/get/${warehouseId}`);
      return res.data.racks;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const rackSlice = createSlice({
  name: "rack",
  initialState: { racks: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createRack.pending, (state) => {
        state.loading = true;
      })
      .addCase(createRack.fulfilled, (state, action) => {
        state.loading = false;
        state.racks.push(action.payload);
      })
      .addCase(createRack.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchRacks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRacks.fulfilled, (state, action) => {
        state.loading = false;
        state.racks = action.payload;
      })
      .addCase(fetchRacks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default rackSlice.reducer;
