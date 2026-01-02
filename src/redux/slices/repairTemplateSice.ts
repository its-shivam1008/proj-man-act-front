import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { RepairTemplate } from "@/types/repair.types";

interface RepairTemplateState {
  data: RepairTemplate[];
  loading: boolean;
  error?: string;
}

const initialState: RepairTemplateState = {
  data: [],
  loading: false,
};

export const fetchRepairTemplates = createAsyncThunk(
  "repairTemplates/fetch",
  async () => {
    const res = await api.get("/repair-templates/fetch");
    return res.data.data as RepairTemplate[];
  }
);

export const createRepairTemplate = createAsyncThunk(
  "repairTemplates/create",
  async (payload: Partial<RepairTemplate>) => {
    const res = await api.post("/repair-templates/create", payload);
    return res.data.data as RepairTemplate;
  }
);

export const updateRepairTemplate = createAsyncThunk(
  "repairTemplates/update",
  async ({ id, data }: { id: string; data: Partial<RepairTemplate> }) => {
    const res = await api.put(`/repair-templates/update/${id}`, data);
    return res.data.data as RepairTemplate;
  }
);

export const deleteRepairTemplate = createAsyncThunk(
  "repairTemplates/delete",
  async (id: string) => {
    await api.delete(`/repair-templates/delete/${id}`);
    return id;
  }
);

const repairTemplateSlice = createSlice({
  name: "repairTemplates",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRepairTemplates.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRepairTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchRepairTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(createRepairTemplate.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })

      .addCase(updateRepairTemplate.fulfilled, (state, action) => {
        const index = state.data.findIndex(
          (t) => t._id === action.payload._id
        );
        if (index !== -1) state.data[index] = action.payload;
      })

      .addCase(deleteRepairTemplate.fulfilled, (state, action) => {
        state.data = state.data.filter((t) => t._id !== action.payload);
      });
  },
});

export default repairTemplateSlice.reducer;
