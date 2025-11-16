
import { BASE_URL } from "@/utils/constants";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "@/utils/axiosApi";

export const fetchManpower = createAsyncThunk(
  "manpower/fetchManpower",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(BASE_URL);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

interface Manpower {
  _id: string;
  name: string;
  skill: string;
  rate: number;
  unit: string;
  availability: boolean;
  // ... other fields
}

interface ManpowerState {
  manpower: Manpower[];
  loading: boolean;
  error: string | null;
}

const initialState: ManpowerState = {
  manpower: [],
  loading: false,
  error: null,
};

const manpowerSlice = createSlice({
  name: "manpower",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchManpower.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchManpower.fulfilled, (state, action) => {
      state.loading = false;
      state.manpower = action.payload;
    });
    builder.addCase(fetchManpower.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export default manpowerSlice.reducer;