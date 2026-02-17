// import { BASE_URL } from "@/utils/constants";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
// import axios from "axios";
import api from "@/utils/axiosApi";

export type WBSItemType = "phase" | "activity" | "task" | "subtask";
export type WBSItemStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "delayed";

// const api = api.create({
//   baseURL: BASE_URL,
//   headers: { "Content-Type": "application/json" },
// });

export interface WBSItem {
  id: string;
  projectId: string;
  parentId: string | null;
  name: string;
  description?: string;
  drawingCode?: string;
  type: WBSItemType;
  startDate?: string;
  endDate?: string;
  duration?: number;
  plannedCost?: number;
  actualCost?: number;
  manpowerRequirement?: string;
  materialRequirement?: string;
  dependencies?: string[];
  status?: WBSItemStatus;
  progress?: number;
  wbsCreatedAt?: string;
  wbsCompletedAt?: string;
  wbsDurationInDays?: number;
  createdAt?: string;
  updatedAt?: string;
  // Pause/Resume fields
  isPaused?: boolean;
  pausedAt?: string;
  resumedAt?: string;
  totalPausedDays?: number;
  pauseHistory?: Array<{
    pausedAt: string;
    resumedAt?: string;
    pausedDays?: number;
    pausedSeconds?: number;
    pausedMilliseconds?: number;
    reason?: string;
    resumeReason?: string;
  }>;
  linkedMaterials?: {
  materialId: string;
  name: string;
  quantity: number;        // total required
  usedQuantity: number;    // already consumed
}[];
  pausedAssignmentsSnapshot?: any;
  totalPausedSeconds?: number;
  totalPausedMilliseconds?: number;
}

interface WbsState {
  wbs: WBSItem[];
  items: any[];
  loading: boolean;
  error: string | null;
  selectedItem?: WBSItem | null;
}

const initialState: WbsState = {
  wbs: [],
  items: [],
  loading: false,
  error: null,
  selectedItem: null,
};

/* ----------------------------------------------------
   FETCH WBS BY PROJECT
---------------------------------------------------- */
export const fetchWbsByProject = createAsyncThunk<
  WBSItem[],
  string,
  { rejectValue: string }
>("wbs/fetchByProject", async (projectId, { rejectWithValue }) => {
  try {
    const organisationId = localStorage.getItem("organisationId");
    if (!organisationId) return rejectWithValue("Organisation ID missing");

    const res = await api.get(`/wbs/get/${projectId}`, {
      params: { organisationId },
    });



    return res.data.map((it: any) => ({ ...it, id: it._id }));
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || "Fetch failed");
  }
});

/* ----------------------------------------------------
   CREATE ITEM
---------------------------------------------------- */
export const createWbsItem = createAsyncThunk<WBSItem, Partial<WBSItem>>(
  "wbs/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post(`/wbs/create`, payload, {
        params: { organisationId: localStorage.getItem("organisationId") },
      });

      return { ...res.data, id: res.data._id };
    } catch (err: any) {
      return rejectWithValue("Create failed");
    }
  }
);

export const assignPersonToWbs = createAsyncThunk(
  "wbs/assignPerson",
  async (data: {
    wbsId: string;
    resourceId: string;
    type: string;
    personalInfo: any;
    employment: any;
    financial: any;
  }, { rejectWithValue }) => {
    try {
      // Make sure the endpoint matches the route file
      const response = await api.post("/wbs/assign-person", data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to assign person");
    }
  }
);

export const removePersonFromWbs = createAsyncThunk(
  "wbs/removePerson",
  async (data: { wbsId: string; resourceId: string }, { rejectWithValue }) => {
    try {
      const response = await api.post("/wbs/remove-person", data);
      return response.data; // Returns the updated WBS object
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to remove person");
    }
  }
);

/* ----------------------------------------------------
   UPDATE ITEM
---------------------------------------------------- */
export const updateWbsItem = createAsyncThunk<
  WBSItem,
  { id: string; data: Partial<WBSItem> },
  { rejectValue: string }
>("wbs/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/wbs/update/${id}`, data);
    return { ...res.data, id: res.data._id || id };
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || "Update failed");
  }
});

/* ----------------------------------------------------
   DELETE ITEM
---------------------------------------------------- */
export const deleteWbsItem = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("wbs/delete", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/wbs/delete/${id}`);
    return id;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || "Delete failed");
  }
});

/* ----------------------------------------------------
   PAUSE WBS TASK
---------------------------------------------------- */
export const pauseWbsTask = createAsyncThunk<
  WBSItem,
  { id: string; reason?: string },
  { rejectValue: string }
>("wbs/pause", async ({ id, reason }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/wbs/pause/${id}`, { reason });
    return { ...res.data.data, id: res.data.data._id || id };
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || "Pause failed");
  }
});

export const fetchWbsByIds = createAsyncThunk(
  "wbs/fetchByIds",
  async (wbsIds: string[], { rejectWithValue }) => {
    try {
      const res = await api.post("/wbs/by-ids", { wbsIds });
      return res.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch WBS by IDs"
      );
    }
  }
);

/* ----------------------------------------------------
   RESUME WBS TASK
---------------------------------------------------- */
export const resumeWbsTask = createAsyncThunk<
  WBSItem,
  { id: string; resumeReason?: string; resolutions?: any[] }, // Added resolutions
  { rejectValue: string }
>("wbs/resume", async ({ id, resumeReason, resolutions }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/wbs/resume/${id}`, { resumeReason, resolutions });
    return { ...res.data.data, id: res.data.data._id || id };
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || "Resume failed");
  }
});

/* ----------------------------------------------------
   SLICE
---------------------------------------------------- */
const wbsSlice = createSlice({
  name: "wbs",
  initialState,
  reducers: {
    setSelectedItem(state, action: PayloadAction<WBSItem | null>) {
      state.selectedItem = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    /* FETCH */
    builder.addCase(fetchWbsByProject.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchWbsByProject.fulfilled, (state, action) => {
      state.loading = false;
      state.wbs = action.payload; // FIXED
    });
    builder.addCase(fetchWbsByProject.rejected, (state, action) => {
      console.log("WBS DATA:", action.payload);
      state.loading = false;
      state.error = action.payload || "Fetch failed";
    }).addCase(fetchWbsByIds.pending, (state) => {
      state.loading = true;
    })
      .addCase(fetchWbsByIds.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload; // 🔥 STORE FETCHED WBS
      })
      .addCase(fetchWbsByIds.rejected, (state) => {
        state.loading = false;
      });

    /* CREATE */
    builder.addCase(createWbsItem.fulfilled, (state, action) => {
      state.wbs.push(action.payload); // FIXED
    });

    /* UPDATE */
    builder.addCase(updateWbsItem.fulfilled, (state, action) => {
      const idx = state.wbs.findIndex((i) => i.id === action.payload.id);
      if (idx >= 0) state.wbs[idx] = action.payload; // FIXED
    });

    /* DELETE */
    builder.addCase(deleteWbsItem.fulfilled, (state, action) => {
      state.wbs = state.wbs.filter((i) => i.id !== action.payload); // FIXED
    });

    /* PAUSE */
    builder.addCase(pauseWbsTask.fulfilled, (state, action) => {
      const idx = state.wbs.findIndex((i) => i.id === action.payload.id);
      if (idx >= 0) state.wbs[idx] = action.payload;
    });

    /* RESUME */
    builder.addCase(resumeWbsTask.fulfilled, (state, action) => {
      const idx = state.wbs.findIndex((i) => i.id === action.payload.id);
      if (idx >= 0) state.wbs[idx] = action.payload;
    });
  },
});

export const { setSelectedItem, clearError } = wbsSlice.actions;
export default wbsSlice.reducer;
