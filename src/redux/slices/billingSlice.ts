import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { Milestone, Invoice } from "@/types/billing";

/* ---------------------------------------------------
   Helper: get organisationId from localStorage
--------------------------------------------------- */
const getOrg = () => localStorage.getItem("organisationId");


export const fetchPaginatedMilestones = createAsyncThunk(
  "billing/fetchPaginatedMilestones",
  async ({ page = 1, limit = 10, search = "", projectId = "", organisationId = "" }) => {
    const res = await api.get("/get/milestone/paginated", {
      params: { page, limit, search, projectId, organisationId },
    });
    return res.data;
  }
);

/* ---------------------------------------------------
   FETCH MILESTONES
--------------------------------------------------- */
export const fetchMilestones = createAsyncThunk(
  "billing/fetchMilestones",
  async () => {
    const res = await api.get(`/get/milestone`, {
      params: { organisationId: getOrg() },
    });
    return res.data.data as Milestone[];
  }
);

/* ---------------------------------------------------
   CREATE MILESTONE
--------------------------------------------------- */
export const createMilestone = createAsyncThunk(
  "billing/createMilestone",
  async (payload: Milestone) => {
    const res = await api.post(`/create/milestone`, {
      ...payload,
      organisationId: getOrg(),
    });
    return res.data.data as Milestone;
  }
);

/* ---------------------------------------------------
   UPDATE MILESTONE
--------------------------------------------------- */
export const updateMilestone = createAsyncThunk(
  "billing/updateMilestone",
  async ({ id, payload }: { id: string; payload: Partial<Milestone> }) => {
    const res = await api.put(`/milestone/update/${id}`, payload);
    return res.data.data as Milestone;
  }
);

/* ---------------------------------------------------
   DELETE MILESTONE
--------------------------------------------------- */
export const deleteMilestone = createAsyncThunk(
  "billing/deleteMilestone",
  async (id: string) => {
    await api.delete(`/milestone/delete/${id}`);
    return id;
  }
);

/* ---------------------------------------------------
   FETCH INVOICES
--------------------------------------------------- */
export const fetchInvoices = createAsyncThunk(
  "billing/fetchInvoices",
  async () => {
    const res = await api.get(`/get/invoice`, {
      params: { organisationId: getOrg() },
    });
    return res.data.data as Invoice[];
  }
);

/* ---------------------------------------------------
   CREATE INVOICE
--------------------------------------------------- */
export const createInvoice = createAsyncThunk(
  "billing/createInvoice",
  async (payload: Invoice) => {
    const res = await api.post(`/create/invoice`, {
      ...payload,
      organisationId: getOrg(),
    });
    return res.data.data as Invoice;
  }
);

/* ---------------------------------------------------
   UPDATE INVOICE
--------------------------------------------------- */
export const updateInvoice = createAsyncThunk(
  "billing/updateInvoice",
  async ({ id, payload }: { id: string; payload: Partial<Invoice> }) => {
    const res = await api.put(`/update/invoice/${id}`, payload);
    return res.data.data as Invoice;
  }
);

/* ---------------------------------------------------
   DELETE INVOICE
--------------------------------------------------- */
export const deleteInvoice = createAsyncThunk(
  "billing/deleteInvoice",
  async (id: string) => {
    await api.delete(`/delete/invoice/${id}`);
    return id;
  }
);

/* ---------------------------------------------------
   SLICE
--------------------------------------------------- */
interface BillingState {
  milestones: Milestone[];
  invoices: Invoice[];
  loading: boolean;
  page: number;
  total: number;
  totalPages: number;
}

const initialState: BillingState = {
  milestones: [],
  invoices: [],
  loading: false,
  page: 1,
  total: 0,
  totalPages: 1,
};

const billingSlice = createSlice({
  name: "billing",
  initialState,
  reducers: {},
  extraReducers: (builder) => {

    /* ----------------- MILESTONES ----------------- */
    builder.addCase(fetchPaginatedMilestones.fulfilled, (state, action) => {
      state.milestones = action.payload.data;
      state.page = action.payload.page;
      state.total = action.payload.total;
      state.totalPages = action.payload.totalPages;
      state.loading = false;
    })

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

      /* ----------------- INVOICES ----------------- */

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
