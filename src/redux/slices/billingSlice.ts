import { BASE_URL } from "./../../utils/constants";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { Milestone, Invoice } from "../../types/billing";
import api from "@/utils/axiosApi";

export const fetchMilestones = createAsyncThunk(
  "billing/fetchMilestones",
  async () => {
    const res = await api.get(`/get/milestone`);
    return res.data.data as Milestone[];
  }
);

// CREATE milestone
export const createMilestone = createAsyncThunk(
  "billing/createMilestone",
  async (payload: Milestone) => {
    try {
      const res = await api.post(`/create/milestone`, payload);
      return res.data.data as Milestone;
    } catch (error) {
      console.error(error);
      console.log(error, "error");
    }
  }
);

export const updateMilestone = createAsyncThunk(
  "billing/updateMilestone",
  async ({ id, payload }: { id: string; payload: Partial<Milestone> }) => {
    const res = await api.put(`/milestone/update/${id}`, payload);
    return res.data.data as Milestone;
  }
);

export const deleteMilestone = createAsyncThunk(
  "billing/deleteMilestone",
  async (id: string) => {
    await api.delete(`/milestone/delete/${id}`);
    return id;
  }
);

export const fetchInvoices = createAsyncThunk(
  "billing/fetchInvoices",
  async () => {
    const res = await api.get(`/get/invoice`);
    return res.data.data as Invoice[];
  }
);

export const createInvoice = createAsyncThunk(
  "billing/createInvoice",
  async (payload: Invoice) => {
    const res = await api.post(`/create/invoice`, payload);
    return res.data.data as Invoice;
  }
);

export const updateInvoice = createAsyncThunk(
  "billing/updateInvoice",
  async ({ id, payload }: { id: string; payload: Partial<Invoice> }) => {
    const res = await api.put(`/update/invoice/${id}`, payload);
    return res.data.data as Invoice;
  }
);

export const deleteInvoice = createAsyncThunk(
  "billing/deleteInvoice",
  async (id: string) => {
    await api.delete(`/delete/invoice/${id}`);
    return id;
  }
);

interface BillingState {
  milestones: Milestone[];
  invoices: Invoice[];
  loading: boolean;
}

const initialState: BillingState = {
  milestones: [],
  invoices: [],
  loading: false,
};

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder

      // ======= MILESTONES =======
      .addCase(
        fetchMilestones.fulfilled,
        (state, action: PayloadAction<Milestone[]>) => {
          state.milestones = action.payload;
        }
      )
      .addCase(
        createMilestone.fulfilled,
        (state, action: PayloadAction<Milestone>) => {
          state.milestones.push(action.payload);
        }
      )
      .addCase(
        updateMilestone.fulfilled,
        (state, action: PayloadAction<Milestone>) => {
          const idx = state.milestones.findIndex(
            (m) => m._id === action.payload._id
          );
          if (idx !== -1) state.milestones[idx] = action.payload;
        }
      )
      .addCase(
        deleteMilestone.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.milestones = state.milestones.filter(
            (m) => m._id !== action.payload
          );
        }
      )

      // ======= INVOICES =======
      .addCase(
        fetchInvoices.fulfilled,
        (state, action: PayloadAction<Invoice[]>) => {
          state.invoices = action.payload;
        }
      )
      .addCase(
        createInvoice.fulfilled,
        (state, action: PayloadAction<Invoice>) => {
          state.invoices.push(action.payload);
        }
      )
      .addCase(
        updateInvoice.fulfilled,
        (state, action: PayloadAction<Invoice>) => {
          const idx = state.invoices.findIndex(
            (i) => i._id === action.payload._id
          );
          if (idx !== -1) state.invoices[idx] = action.payload;
        }
      )
      .addCase(
        deleteInvoice.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.invoices = state.invoices.filter(
            (i) => i._id !== action.payload
          );
        }
      );
  },
});

export default billingSlice.reducer;
