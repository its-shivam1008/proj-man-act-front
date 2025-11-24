// redux/slices/masterDataSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";

export interface MasterItem {
  _id: string;
  name: string;
  description?: string;
}

interface MasterState {
  clients: MasterItem[];
  departments: MasterItem[];
  projectTypes: MasterItem[];
  loading: boolean;
}

const initialState: MasterState = {
  clients: [],
  departments: [],
  projectTypes: [],
  loading: false,
};

// Helper type for args
type MasterType = "client" | "department" | "project-type";

// Fetch
export const fetchMasterData = createAsyncThunk(
  "master/fetch",
  async (type: MasterType) => {
    const res = await api.get(`/master/${type}`);
    return { type, data: res.data };
  }
);

// Add
export const addMasterItem = createAsyncThunk(
  "master/add",
  async ({ type, data }: { type: MasterType; data: Partial<MasterItem> }) => {
    const res = await api.post(`/master/${type}`, data);
    return { type, data: res.data };
  }
);

// Update
export const updateMasterItem = createAsyncThunk(
  "master/update",
  async ({ type, id, data }: { type: MasterType; id: string; data: Partial<MasterItem> }) => {
    const res = await api.put(`/master/${type}/${id}`, data);
    return { type, data: res.data };
  }
);

// Delete
export const deleteMasterItem = createAsyncThunk(
  "master/delete",
  async ({ type, id }: { type: MasterType; id: string }) => {
    await api.delete(`/master/${type}/${id}`);
    return { type, id };
  }
);

const masterDataSlice = createSlice({
  name: "masterData",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchMasterData.fulfilled, (state, action) => {
        const { type, data } = action.payload;
        if (type === "client") state.clients = data;
        if (type === "department") state.departments = data;
        if (type === "project-type") state.projectTypes = data;
      })
      // Add
      .addCase(addMasterItem.fulfilled, (state, action) => {
        const { type, data } = action.payload;
        if (type === "client") state.clients.unshift(data);
        if (type === "department") state.departments.unshift(data);
        if (type === "project-type") state.projectTypes.unshift(data);
      })
      // Update
      .addCase(updateMasterItem.fulfilled, (state, action) => {
        const { type, data } = action.payload;
        const updateList = (list: MasterItem[]) => 
            list.map(i => i._id === data._id ? data : i);
            
        if (type === "client") state.clients = updateList(state.clients);
        if (type === "department") state.departments = updateList(state.departments);
        if (type === "project-type") state.projectTypes = updateList(state.projectTypes);
      })
      // Delete
      .addCase(deleteMasterItem.fulfilled, (state, action) => {
        const { type, id } = action.payload;
        const filterList = (list: MasterItem[]) => list.filter(i => i._id !== id);

        if (type === "client") state.clients = filterList(state.clients);
        if (type === "department") state.departments = filterList(state.departments);
        if (type === "project-type") state.projectTypes = filterList(state.projectTypes);
      });
  },
});

export default masterDataSlice.reducer;