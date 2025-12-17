// import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// import axios from "@/utils/axiosApi";

// /* =======================
//    ASYNC THUNKS
// ======================= */

// export const fetchWorkCenters = createAsyncThunk(
//   "workCenters/fetch",
//   async (params: { search?: string; status?: string }) => {
//     const res = await axios.get("/work-centers", { params });
//     return res.data.data;
//   }
// );

// export const createWorkCenter = createAsyncThunk(
//   "workCenters/create",
//   async (data: any) => {
//     const res = await axios.post("/work-centers", data);
//     return res.data.data;
//   }
// );

// export const updateWorkCenter = createAsyncThunk(
//   "workCenters/update",
//   async ({ id, data }: { id: string; data: any }) => {
//     const res = await axios.put(`/work-centers/${id}`, data);
//     return res.data.data;
//   }
// );

// export const deleteWorkCenter = createAsyncThunk(
//   "workCenters/delete",
//   async (id: string) => {
//     await axios.delete(`/work-centers/${id}`);
//     return id;
//   }
// );

// export const fetchWorkCenterAnalytics = createAsyncThunk(
//   "workCenters/analytics",
//   async () => {
//     const res = await axios.get("/work-centers/analytics/summary");
//     return res.data.data;
//   }
// );

// /* =======================
//    STATE TYPE
// ======================= */

// interface WorkCenterState {
//   list: any[];
//   analytics: {
//     total: number;
//     active: number;
//     avgEfficiency: number;
//   };
//   loading: boolean;
//   error: string | null;
// }

// const initialState: WorkCenterState = {
//   list: [],
//   analytics: {
//     total: 0,
//     active: 0,
//     avgEfficiency: 0,
//   },
//   loading: false,
//   error: null,
// };

// /* =======================
//    SLICE
// ======================= */

// const workCenterSlice = createSlice({
//   name: "workCenters",
//   initialState,
//   reducers: {},

//   extraReducers: (builder) => {
//     /* ---------- addCase FIRST ---------- */

//     builder.addCase(fetchWorkCenters.fulfilled, (state, action) => {
//       state.list = action.payload;
//     });

//     builder.addCase(createWorkCenter.fulfilled, (state, action) => {
//       state.list.unshift(action.payload);
//     });

//     builder.addCase(updateWorkCenter.fulfilled, (state, action) => {
//       const index = state.list.findIndex(
//         (w: any) => w._id === action.payload._id
//       );
//       if (index !== -1) {
//         state.list[index] = action.payload;
//       }
//     });

//     builder.addCase(deleteWorkCenter.fulfilled, (state, action) => {
//       state.list = state.list.filter(
//         (w: any) => w._id !== action.payload
//       );
//     });

//     builder.addCase(fetchWorkCenterAnalytics.fulfilled, (state, action) => {
//       state.analytics = action.payload;
//     });

//     /* ---------- addMatcher AFTER addCase ---------- */

//     builder.addMatcher(
//       (action) =>
//         action.type.startsWith("workCenters/") &&
//         action.type.endsWith("/pending"),
//       (state) => {
//         state.loading = true;
//         state.error = null;
//       }
//     );

//     builder.addMatcher(
//       (action) =>
//         action.type.startsWith("workCenters/") &&
//         action.type.endsWith("/fulfilled"),
//       (state) => {
//         state.loading = false;
//       }
//     );

//     builder.addMatcher(
//       (action) =>
//         action.type.startsWith("workCenters/") &&
//         action.type.endsWith("/rejected"),
//       (state, action: any) => {
//         state.loading = false;
//         state.error = action.error?.message || "Something went wrong";
//       }
//     );
//   },
// });

// export default workCenterSlice.reducer;
