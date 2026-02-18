import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { Milestone, Invoice } from "@/types/billing";
export interface ContractorBill {
  _id: string;
  organisationId: string;
  projectId: string;
  wbsId: string;
  contractorId: string;
  amount: number;
  paymentDate: string;
  notes?: string;
}
export interface CreateContractorBillPayload {
  projectId: string;
  wbsId: string;
  contractorId: string;
  amount: number;
  paymentDate: string;
  notes?: string;
}

/* ---------------------------------------------------
   Helper: get organisationId from localStorage
--------------------------------------------------- */
const getOrg = () => localStorage.getItem("organisationId");


export const fetchPaginatedMilestones = createAsyncThunk(
  "billing/fetchPaginatedMilestones",
  async ({
    page = 1,
    limit = 10,
    search = "",
    projectId,
    organisationId,
    location,
  }: {
    page?: number;
    limit?: number;
    search?: string;
    projectId?: string;
    organisationId?: string;
    location?: string;
  }) => {
    const res = await api.get("/get/milestone/paginated", {
      params: {
        page,
        limit,
        search,
        projectId,
        organisationId,
        ...(location ? { location } : {}), // ✅ only send if exists
      },
    });
    return res.data;
  }
);


//contractor bills
/* ---------------------------------------------------
   FETCH CONTRACTOR BILLS
--------------------------------------------------- */
export const fetchContractorBills = createAsyncThunk(
  "billing/fetchContractorBills",
  async () => {
    const res = await api.get("/get/contractor-bill", {
      params: { organisationId: getOrg() },
    });
    return res.data.data;
  }
);

/* ---------------------------------------------------
   CREATE CONTRACTOR BILL
--------------------------------------------------- */
export const createContractorBill = createAsyncThunk<
  ContractorBill,
  CreateContractorBillPayload
>(
  "billing/createContractorBill",
  async (payload) => {
    const res = await api.post("/create/contractor-bill", {
      ...payload,
      organisationId: getOrg(),
    });

    return res.data.data;
  }
);

/* ---------------------------------------------------
   UPDATE CONTRACTOR BILL
--------------------------------------------------- */
export const updateContractorBill = createAsyncThunk(
  "billing/updateContractorBill",
  async ({ id, payload }: { id: string; payload: Partial<ContractorBill> }) => {
    const res = await api.put(`/update/contractor-bill/${id}`, payload);
    return res.data.data;
  }
);

/* ---------------------------------------------------
   DELETE CONTRACTOR BILL
--------------------------------------------------- */
export const deleteContractorBill = createAsyncThunk(
  "billing/deleteContractorBill",
  async (id: string) => {
    await api.delete(`/delete/contractor-bill/${id}`);
    return id;
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
  async ({ organisationId }: { organisationId: string }) => {
    const res = await api.get("/get/invoice", {
      params: { organisationId },
    });

    return res.data.data;
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
  contractorBills: ContractorBill[];
  page: number;
  total: number;
  totalPages: number;
}

const initialState: BillingState = {
  milestones: [],
  invoices: [],
  contractorBills: [],
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
      )/* ----------------- CONTRACTOR BILLS ----------------- */

      .addCase(
        fetchContractorBills.fulfilled,
        (state, action: PayloadAction<ContractorBill[]>) => {
          state.contractorBills = action.payload;
        }
      )

      .addCase(
        createContractorBill.fulfilled,
        (state, action: PayloadAction<ContractorBill>) => {
          state.contractorBills.unshift(action.payload);
        }
      )

      .addCase(
        updateContractorBill.fulfilled,
        (state, action: PayloadAction<ContractorBill>) => {
          const idx = state.contractorBills.findIndex(
            (b) => b._id === action.payload._id
          );
          if (idx !== -1) state.contractorBills[idx] = action.payload;
        }
      )

      .addCase(
        deleteContractorBill.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.contractorBills = state.contractorBills.filter(
            (b) => b._id !== action.payload
          );
        }
      );;
  },
});

export default billingSlice.reducer;
