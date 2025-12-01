import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { MRSItem } from "@/types/procurement";
import { BASE_URL } from "@/utils/constants";
import api from "@/utils/axiosApi";

export const fetchMRS = createAsyncThunk<MRSItem[]>(
  "mrs/fetchMRS",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get(`/get/mrs`);
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
      const res = await api.post(`/create/mrs`, data);
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

export const createBulkMRS = createAsyncThunk<MRSItem[], Partial<MRSItem>[]>(
  "mrs/createBulkMRS",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.post(`/create/mrs/bulk`, data);
      return res.data.data as MRSItem[];
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);


export const updateMRS = createAsyncThunk<
  MRSItem,
  { id: string; data: Partial<MRSItem> }
>("mrs/updateMRS", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/update/mrs/${id}`, data);
    return res.data.data as MRSItem;
  } catch (err: any) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const deleteMRS = createAsyncThunk<string, string>(
  "mrs/deleteMRS",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/delete/mrs/${id}`);
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
      .addCase(createBulkMRS.fulfilled, (state, action) => {
        state.list.push(...action.payload);
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
