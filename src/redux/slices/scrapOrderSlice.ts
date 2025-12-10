import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosApi from "@/utils/axiosApi";
import { toast } from "sonner";

// Types
export interface ScrapOrder {
    _id: string;
    productId: string;
    quantity: number;
    reason: string;
    scrapLocation: string;
    status: "pending" | "approved" | "completed";
    date: string;
    remark?: string;
    organisationId: string;
}

interface ScrapState {
    scrapOrders: ScrapOrder[];
    selectedScrapOrder: ScrapOrder | null;
    loading: boolean;
    error: string | null;
}

const initialState: ScrapState = {
    scrapOrders: [],
    selectedScrapOrder: null,
    loading: false,
    error: null,
};

export const createScrapOrder = createAsyncThunk(
    "scrap/create",
    async (data: any, { rejectWithValue }) => {
        try {
            const res = await axiosApi.post("/scrap/create", data);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err?.response?.data || err.message);
        }
    }
);
export const getScrapOrders = createAsyncThunk(
    "scrap/getAll",
    async ({ location = "" }: { location?: string } = {}, { rejectWithValue }) => { // [!code ++]
        try {
            const res = await axiosApi.get(`/scrap/get/all?location=${location}`); // [!code ++]
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err?.response?.data || err.message);
        }
    }
);
export const getScrapOrderById = createAsyncThunk(
    "scrap/getSingle",
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await axiosApi.get(`/scrap/single/${id}`);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err?.response?.data || err.message);
        }
    }
);

export const updateScrapOrder = createAsyncThunk(
    "scrap/update",
    async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
        try {
            const res = await axiosApi.put(`/scrap/update/${id}`, data);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err?.response?.data || err.message);
        }
    }
);
export const deleteScrapOrder = createAsyncThunk(
    "scrap/delete",
    async (id: string, { rejectWithValue }) => {
        try {
            await axiosApi.delete(`/scrap/delete/${id}`);
            return id;
        } catch (err: any) {
            return rejectWithValue(err?.response?.data || err.message);
        }
    }
);

export const approveScrapOrder = createAsyncThunk(
    "scrap/approve",
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await axiosApi.put(`/scrap/approve/${id}`);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err?.response?.data || err.message);
        }
    }
);
const scrapOrderSlice = createSlice({
    name: "scrap",
    initialState,
    reducers: {
        clearSelectedScrap: (state) => {
            state.selectedScrapOrder = null;
        },
    },

    extraReducers: (builder) => {
        builder
        
            .addCase(createScrapOrder.pending, (state) => {
                state.loading = true;
            })
            .addCase(createScrapOrder.fulfilled, (state, action) => {
                state.loading = false;
                state.scrapOrders.push(action.payload);

                toast.success("Scrap order created successfully");
            })
            .addCase(createScrapOrder.rejected, (state, action) => {
                state.loading = false;
                toast.error("Failed to create scrap order");
                state.error = action.payload as string;
            })
            .addCase(getScrapOrders.pending, (state) => {
                state.loading = true;
            })
            .addCase(getScrapOrders.fulfilled, (state, action) => {
                state.loading = false;
                state.scrapOrders = action.payload;
            })
            .addCase(getScrapOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(getScrapOrderById.fulfilled, (state, action) => {
                state.selectedScrapOrder = action.payload;
            })
            .addCase(updateScrapOrder.fulfilled, (state, action) => {
                state.scrapOrders = state.scrapOrders.map((s) =>
                    s._id === action.payload._id ? action.payload : s
                );

                toast.success("Scrap order updated");
            })
            .addCase(updateScrapOrder.rejected, (state, action) => {
                toast.error("Update failed");
                state.error = action.payload as string;
            })
            .addCase(deleteScrapOrder.fulfilled, (state, action) => {
                state.scrapOrders = state.scrapOrders.filter((s) => s._id !== action.payload);

                toast.success("Scrap order deleted");
            })
            .addCase(approveScrapOrder.fulfilled, (state, action) => {
                state.scrapOrders = state.scrapOrders.map((s) =>
                    s._id === action.payload._id ? action.payload : s
                );

                toast.success("Scrap approved successfully");
            });
    },
});

export const { clearSelectedScrap } = scrapOrderSlice.actions;
export default scrapOrderSlice.reducer;
