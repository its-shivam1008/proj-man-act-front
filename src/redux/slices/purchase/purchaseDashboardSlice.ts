import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

export type FilterType = "po" | "rfq" | "vendor" | "agreement";

interface DashboardState {
    loading: boolean;
    data: any[];
    summary: {
        totalCount?: number;
        totalValue?: number;
        activeVendors?: number;
    };
}

const initialState: DashboardState = {
    loading: false,
    data: [],
    summary: {},
};

// 🔥 Async fetch
export const fetchPurchaseDashboard = createAsyncThunk(
    "purchaseDashboard/fetch",
    async (
        params: {
            type: FilterType;
            fromDate?: string;
            toDate?: string;
            vendorId?: string;
        },
        { rejectWithValue }
    ) => {
        if (typeof window === "undefined") {
            return rejectWithValue("No window");
        }

        const organisationId = localStorage.getItem("organisationId");

        // 🚫 HARD STOP
        if (!organisationId) {
            return rejectWithValue("Organisation ID missing");
        }

        const res = await axios.get("/dashboard/purchase-overview", {
            params,
            headers: {
                "x-organisation-id": organisationId, // optional (for logging)
            },
        });

        return res.data;
    }
);


const purchaseDashboardSlice = createSlice({
    name: "purchaseDashboard",
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchPurchaseDashboard.pending, state => {
                state.loading = true;
            })
            .addCase(fetchPurchaseDashboard.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload.data;
                state.summary = action.payload.summary;
            })
            .addCase(fetchPurchaseDashboard.rejected, state => {
                state.loading = false;
            });
    },
});

export default purchaseDashboardSlice.reducer;
