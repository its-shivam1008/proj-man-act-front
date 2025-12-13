
import { BASE_URL } from "@/utils/constants";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";


export const fetchMaterials = createAsyncThunk(
  "materials/fetchMaterials",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(BASE_URL);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message ?? err.message);
    }
  }
);

interface Material {
  _id: string;
  name: string;
  rate: number;
  unit: string;
  inStock: number;
  // ... other fields
}

interface MaterialState {
  materials: Material[];
  loading: boolean;
  error: string | null;
}

const initialState: MaterialState = {
  materials: [],
  loading: false,
  error: null,
};

const materialSlice = createSlice({
  name: "materials",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchMaterials.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchMaterials.fulfilled, (state, action) => {
      state.loading = false;
      state.materials = action.payload;
    });
    builder.addCase(fetchMaterials.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export default materialSlice.reducer;