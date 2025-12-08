// redux/slices/masterDataSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";

export interface MasterItem {
  _id: string;
  name: string;
  description?: string;
  hrmsLocationId?:string;
}

interface MasterState {
  clients: MasterItem[];
  departments: MasterItem[];
  projectTypes: MasterItem[];
  locations: MasterItem[];
  paginatedList: MasterItem[],
  loading: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  search:string;
  loadingPaginated:boolean;
}

const initialState: MasterState = {
  clients: [],
  departments: [],
  projectTypes: [],
  paginatedList: [],
  locations: [],
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  search: "",
  loadingPaginated: false,

  loading: false,
};

// Helper type for args
type MasterType = "client" | "department" | "project-type" | "location";
export const fetchPaginatedMaster = createAsyncThunk(
  "masterData/fetchPaginated",
  async ({ type, page = 1, limit = 10, search = "" }) => {
    const res = await api.get(`/master/${type}/paginated`, {
      params: { page, limit, search },
    });
    return { type, ...res.data };
  }
);


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
 reducers: {
    setSearchText(state, action) {
      state.search = action.payload;
      state.page = 1;
    },
    setPage(state, action) {
      state.page = action.payload;
    }
},

  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchPaginatedMaster.pending, (state) => {
        state.loadingPaginated = true;
      })
      .addCase(fetchPaginatedMaster.fulfilled, (state, action) => {
        const { data, total, totalPages, page, limit } = action.payload;

        // store paginated list separately 
        state.paginatedList = data;
        state.total = total;
        state.totalPages = totalPages;
        state.page = page;
        state.limit = limit;
        state.search = state.search;

        state.loadingPaginated = false;
      })
      .addCase(fetchMasterData.fulfilled, (state, action) => {
        const { type, data } = action.payload;
        if (type === "client") state.clients = data;
        if (type === "department") state.departments = data;
        if (type === "project-type") state.projectTypes = data;
        if (type === "location") state.locations = data;
      })
      // Add
      .addCase(addMasterItem.fulfilled, (state, action) => {
        const { type, data } = action.payload;
        if (type === "client") state.clients.unshift(data);
        if (type === "department") state.departments.unshift(data);
        if (type === "project-type") state.projectTypes.unshift(data);
        if (type === "location") state.locations.unshift(data);
      })
      // Update
      .addCase(updateMasterItem.fulfilled, (state, action) => {
        const { type, data } = action.payload;
        const updateList = (list: MasterItem[]) =>
          list.map(i => i._id === data._id ? data : i);

        if (type === "client") state.clients = updateList(state.clients);
        if (type === "department") state.departments = updateList(state.departments);
        if (type === "project-type") state.projectTypes = updateList(state.projectTypes);
        if (type === "location") state.locations = updateList(state.locations);
      })
      // Delete
      .addCase(deleteMasterItem.fulfilled, (state, action) => {
        const { type, id } = action.payload;
        const filterList = (list: MasterItem[]) => list.filter(i => i._id !== id);

        if (type === "client") state.clients = filterList(state.clients);
        if (type === "department") state.departments = filterList(state.departments);
        if (type === "project-type") state.projectTypes = filterList(state.projectTypes);
        if (type === "location") state.locations = filterList(state.locations);
      });
  },
});
export const { setPage, setSearchText } = masterDataSlice.actions;



export default masterDataSlice.reducer;