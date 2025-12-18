import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

export const fetchWorkOrders = createAsyncThunk(
  "workOrders/fetch",
  async () => {
    const res = await axios.get("/work-orders");
    return res.data.data;
  }
);

export const createWorkOrder = createAsyncThunk(
  "workOrders/create",
  async (data: any) => {
    const res = await axios.post("/work-orders", data);
    return res.data.data;
  }
);

export const updateWorkOrder = createAsyncThunk(
  "workOrders/update",
  async ({ id, data }: any) => {
    const res = await axios.put(`/work-orders/${id}`, data);
    return res.data.data;
  }
);

export const deleteWorkOrder = createAsyncThunk(
  "workOrders/delete",
  async (id: string) => {
    await axios.delete(`/work-orders/${id}`);
    return id;
  }
);

const slice = createSlice({
  name: "workOrders",
  initialState: {
    list: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (b) => {
    // All addCase calls must come before addMatcher calls
    b.addCase(fetchWorkOrders.fulfilled, (s, a) => {
      s.list = a.payload;
    });

    b.addCase(createWorkOrder.fulfilled, (s, a) => {
      s.list.unshift(a.payload);
    });

    b.addCase(updateWorkOrder.fulfilled, (s, a) => {
      const i = s.list.findIndex((w: any) => w._id === a.payload._id);
      if (i !== -1) s.list[i] = a.payload;
    });

    b.addCase(deleteWorkOrder.fulfilled, (s, a) => {
      s.list = s.list.filter((w: any) => w._id !== a.payload);
    });

    // addMatcher calls must come after all addCase calls
    b.addMatcher(
      (a) => a.type.startsWith("workOrders/") && a.type.endsWith("/pending"),
      (s) => { s.loading = true; }
    );
    b.addMatcher(
      (a) => a.type.startsWith("workOrders/") && a.type.endsWith("/fulfilled"),
      (s) => { s.loading = false; }
    );
  },
});

export default slice.reducer;
