import { BASE_URL } from "@/utils/constants";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import api from "@/utils/axiosApi";

export const createBudget = createAsyncThunk(
  "budget/createBudget",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post(`/budget/create`, payload);
      return res.data.data;
    } catch (err) {
      console.error(err , "error")
      console.log(err)
      return rejectWithValue(err.response?.data || err.message);
      
    }
  }
);

// Get budgets by project
export const fetchBudgetsByProject = createAsyncThunk(
  "budget/fetchBudgetsByProject",
  async (projectId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/budget/project/${projectId}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Get budgets by user
export const fetchBudgetsByUser = createAsyncThunk(
  "budget/fetchBudgetsByUser",
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/budget/user/${userId}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Update Budget
export const updateBudget = createAsyncThunk(
  "budget/updateBudget",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/budget/update/${id}`, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Delete Budget
export const deleteBudget = createAsyncThunk(
  "budget/deleteBudget",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/budget/delete/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Approve Single
export const approveBudget = createAsyncThunk(
  "budget/approveBudget",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.put(`/budget/approve/${id}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Approve All for Project
export const approveAllBudgets = createAsyncThunk(
  "budget/approveAllBudgets",
  async (projectId, { rejectWithValue }) => {
    try {
      const res = await api.put(`/budget/approve-all/${projectId}`);
      return { projectId };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* ──────────── SLICE ──────────── */

const budgetSlice = createSlice({
  name: "budget",
  initialState: {
    budgets: [],
    loading: false,
    error: null,
  },

  reducers: {},

  extraReducers: (builder) => {
    builder

      /* CREATE */
      .addCase(createBudget.pending, (state) => {
        state.loading = true;
      })
      .addCase(createBudget.fulfilled, (state, action) => {
        state.loading = false;
        state.budgets.push(action.payload);
      })
      .addCase(createBudget.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* GET BY PROJECT */
      .addCase(fetchBudgetsByProject.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBudgetsByProject.fulfilled, (state, action) => {
        state.loading = false;
        state.budgets = action.payload;
      })
      .addCase(fetchBudgetsByProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* UPDATE */
      .addCase(updateBudget.fulfilled, (state, action) => {
        const updated = action.payload;
        state.budgets = state.budgets.map((b) =>
          b._id === updated._id ? updated : b
        );
      })

      /* DELETE */
      .addCase(deleteBudget.fulfilled, (state, action) => {
        const id = action.payload;
        state.budgets = state.budgets.filter((b) => b._id !== id);
      })

      /* APPROVE ONE */
      .addCase(approveBudget.fulfilled, (state, action) => {
        const updated = action.payload;
        state.budgets = state.budgets.map((b) =>
          b._id === updated._id ? updated : b
        );
      })

      /* APPROVE ALL */
      .addCase(approveAllBudgets.fulfilled, (state, action) => {
        const { projectId } = action.payload;
        state.budgets = state.budgets.map((b) =>
          b.projectId === projectId
            ? { ...b, approvalStatus: "approved" }
            : b
        );
      });
  },
});

export default budgetSlice.reducer;
