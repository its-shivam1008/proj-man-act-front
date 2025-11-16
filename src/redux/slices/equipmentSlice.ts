import { BASE_URL } from '@/utils/constants';

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "@/utils/axiosApi";


export const fetchEquipment = createAsyncThunk(
  "equipment/fetchEquipment",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(BASE_URL);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

interface Equipment {
  _id: string;
  name: string;
  rate: number;
  unit: string;
  status: "available" | "booked" | "maintenance";
  // ... other fields
}

interface EquipmentState {
  equipment: Equipment[];
  loading: boolean;
  error: string | null;
}

const initialState: EquipmentState = {
  equipment: [],
  loading: false,
  error: null,
};

const equipmentSlice = createSlice({
  name: "equipment",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchEquipment.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchEquipment.fulfilled, (state, action) => {
      state.loading = false;
      state.equipment = action.payload;
    });
    builder.addCase(fetchEquipment.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export default equipmentSlice.reducer;