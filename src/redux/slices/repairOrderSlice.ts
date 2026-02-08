import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { RepairOrder, Pagination } from "@/types/repair.types";

interface FetchParams {
  location?: string;
  page?: number;
  limit?: number;
}

interface RepairOrderState {
  data: RepairOrder[];
  pagination?: Pagination;
  loading: boolean;
  error?: string;
}

const initialState: RepairOrderState = {
  data: [],
  loading: false,
};

/* ---------------- THUNKS ---------------- */

// export const acceptRepairOrder = createAsyncThunk(
//   "repairOrders/accept",
//   async (id: string) => {
//     const res = await api.post(`/repair-orders/${id}/accept`);
//     return res.data.data;
//   }
// );

// export const rejectRepairOrder = createAsyncThunk(
//   "repairOrders/reject",
//   async ({ id, reason }: any) => {
//     const res = await api.post(`/repair-orders/${id}/reject`, { reason });
//     return res.data.data;
//   }
// );

export const fetchRepairOrders = createAsyncThunk(
  "repairOrders/fetch",
  async (params: FetchParams) => {
    console.log('Redux: Making API call to /repair-orders/fetch with params:', params);
    const res = await api.get("/repair-orders/fetch", { params });
    console.log('Redux: API response received:', res.data);
    return res.data;
  }
);

export const createRepairOrder = createAsyncThunk(
  "repairOrders/create",
  async (payload: Partial<RepairOrder>) => {
    const res = await api.post("/repair-orders/create", payload);
    return res.data.data as RepairOrder;
  }
);

export const updateRepairOrder = createAsyncThunk(
  "repairOrders/update",
  async ({ id, data }: { id: string; data: Partial<RepairOrder> }) => {
    const res = await api.put(`/repair-orders/update/${id}`, data);
    return res.data.data as RepairOrder;
  }
);

export const deleteRepairOrder = createAsyncThunk(
  "repairOrders/delete",
  async (id: string) => {
    await api.delete(`/repair-orders/delete/${id}`);
    return id;
  }
);

/* ---------------- SLICE ---------------- */

const repairOrderSlice = createSlice({
  name: "repairOrders",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRepairOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRepairOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchRepairOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(createRepairOrder.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
      })

      .addCase(updateRepairOrder.fulfilled, (state, action) => {
        const index = state.data.findIndex(
          (o) => o._id === action.payload._id
        );
        if (index !== -1) state.data[index] = action.payload;
      })

      .addCase(deleteRepairOrder.fulfilled, (state, action) => {
        state.data = state.data.filter((o) => o._id !== action.payload);
      })
    // .addCase(acceptRepairOrder.fulfilled, (state, action) => {
    //     state.data = state.data.map((o: any) =>
    //       o._id === action.payload._id ? action.payload : o
    //     );
    //   });

    // builder.addCase(rejectRepairOrder.fulfilled, (state, action) => {
    //   state.data = state.data.map((o: any) =>
    //     o._id === action.payload._id ? action.payload : o
    //   );
    // });

  },
});

export default repairOrderSlice.reducer;
