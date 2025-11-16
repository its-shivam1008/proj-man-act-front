import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { MRSItem } from "@/types/procurement";
import { BASE_URL } from "@/utils/constants";
export const fetchMRS = createAsyncThunk<MRSItem[]>(
  "mrs/fetchMRS",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${BASE_URL}/get/mrs`);
      return res.data as MRSItem[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createMRS = createAsyncThunk<MRSItem, Partial<MRSItem>>(
  "mrs/createMRS",
  async (data, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${BASE_URL}/create/mrs`, data);
      return res.data.mrs as MRSItem;
    } catch (err: any) {
      // Log full error for debugging
      console.error("Create MRS Error:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateMRS = createAsyncThunk<
  MRSItem,
  { id: string; data: Partial<MRSItem> }
>("mrs/updateMRS", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await axios.put(`${BASE_URL}/update/mrs/${id}`, data);
    return res.data.data as MRSItem;
  } catch (err: any) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const deleteMRS = createAsyncThunk<string, string>(
  "mrs/deleteMRS",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(`${BASE_URL}/delete/mrs/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);
interface MRSState {
  list: MRSItem[];
  loading: boolean;
  error: string | null;
}

const initialState: MRSState = {
  list: [],
  loading: false,
  error: null,
};
const mrsSlice = createSlice({
  name: "mrs",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder
      .addCase(fetchMRS.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchMRS.fulfilled,
        (state, action: PayloadAction<MRSItem[]>) => {
          state.loading = false;
          state.list = action.payload;
        }
      )
      .addCase(fetchMRS.rejected, (state, action: any) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createMRS.fulfilled, (state, action: PayloadAction<MRSItem>) => {
        state.list.push(action.payload);
      })
      .addCase(updateMRS.fulfilled, (state, action: PayloadAction<MRSItem>) => {
        const updated = action.payload;
        const idx = state.list.findIndex((i) => i._id === updated._id);
        if (idx !== -1) state.list[idx] = updated;
      })
      .addCase(deleteMRS.fulfilled, (state, action: PayloadAction<string>) => {
        state.list = state.list.filter((i) => i._id !== action.payload);
      });
  },
});

export default mrsSlice.reducer;
