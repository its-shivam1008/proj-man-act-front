import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import {
  QualityTag,
  CreateQualityTagData,
  UpdateQualityTagData,
  QualityTagFilters,
} from "@/types/quality.types";

interface QualityTagState {
  qualityTags: QualityTag[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalTags: number;
}

const initialState: QualityTagState = {
  qualityTags: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalPages: 1,
  totalTags: 0,
};

// Fetch Quality Tags
export const fetchQualityTags = createAsyncThunk(
  "qualityTags/fetch",
  async (args: QualityTagFilters, { rejectWithValue }) => {
    const { page, limit, category, isActive, search, location } = args;
    try {
      const organisationId = localStorage.getItem("organisationId");

      const res = await api.get(`/api/quality/get/quality-tags`, {
        params: {
          organisationId,
          page,
          limit,
          category,
          isActive,
          search,
          location,
        },
      });

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch quality tags."
      );
    }
  }
);

// Add Quality Tag
export const addQualityTag = createAsyncThunk(
  "qualityTags/add",
  async (data: CreateQualityTagData, { rejectWithValue }) => {
    try {
      const organisationId = localStorage.getItem("organisationId");
      const res = await api.post(`/api/quality/create/quality-tag`, {
        ...data,
        organisationId,
      });

      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to create quality tag."
      );
    }
  }
);

// Update Quality Tag
export const updateQualityTag = createAsyncThunk(
  "qualityTags/update",
  async ({ id, data }: { id: string; data: UpdateQualityTagData }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/quality/quality-tag/update/${id}`, data);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to update quality tag."
      );
    }
  }
);

// Delete Quality Tag
export const deleteQualityTag = createAsyncThunk(
  "qualityTags/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/api/quality/quality-tag/delete/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to delete quality tag."
      );
    }
  }
);

// Get Quality Tag by ID
export const getQualityTagById = createAsyncThunk(
  "qualityTags/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/quality/quality-tag/${id}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to fetch quality tag."
      );
    }
  }
);

// Increment Usage Count
export const incrementUsageCount = createAsyncThunk(
  "qualityTags/incrementUsage",
  async (tagId: string, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/quality/quality-tag/increment-usage/${tagId}`);
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message || "Failed to increment usage count."
      );
    }
  }
);

const qualityTagSlice = createSlice({
  name: "qualityTags",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchQualityTags.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQualityTags.fulfilled, (state, action) => {
        state.loading = false;
        state.qualityTags = action.payload.qualityTags;
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.totalTags = action.payload.totalTags;
      })
      .addCase(fetchQualityTags.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ADD
      .addCase(addQualityTag.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addQualityTag.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.qualityTags.unshift(action.payload);
          state.totalTags += 1;
        }
      })
      .addCase(addQualityTag.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // UPDATE
      .addCase(updateQualityTag.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQualityTag.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.qualityTags = state.qualityTags.map((tag) =>
            tag._id === action.payload._id ? action.payload : tag
          );
        }
      })
      .addCase(updateQualityTag.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // DELETE
      .addCase(deleteQualityTag.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQualityTag.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.qualityTags = state.qualityTags.filter(
            (tag) => tag._id !== action.payload
          );
          state.totalTags -= 1;
        }
      })
      .addCase(deleteQualityTag.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // GET BY ID
      .addCase(getQualityTagById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQualityTagById.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(getQualityTagById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // INCREMENT USAGE
      .addCase(incrementUsageCount.pending, (state) => {
        state.error = null;
      })
      .addCase(incrementUsageCount.fulfilled, (state, action) => {
        if (action.payload) {
          state.qualityTags = state.qualityTags.map((tag) =>
            tag._id === action.payload._id ? action.payload : tag
          );
        }
      })
      .addCase(incrementUsageCount.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = qualityTagSlice.actions;
export default qualityTagSlice.reducer;