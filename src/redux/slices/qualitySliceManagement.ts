import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";
import {
    QualityTab,
    QualityItem,
    FetchQualityArgs,
    MutateQualityArgs,
} from "../../types/quality.types";
import { RootState } from "../store";

export const fetchQualityByTab = createAsyncThunk<
    { tab: QualityTab; items: QualityItem[] },
    FetchQualityArgs,
    { rejectValue: string }
>("quality/fetchByTab", async ({ tab, filters }, { rejectWithValue }) => {
    try {
        const res = await axios.get("/api/quality", {
            params: { tab, ...filters },
        });

        return {
            tab,
            items: res.data.items || res.data.data || [],
        };
    } catch (err: any) {
        return rejectWithValue(
            err.response?.data?.message || "Failed to fetch"
        );
    }
});

export const createQuality = createAsyncThunk<
    { tab: QualityTab; item: QualityItem },
    MutateQualityArgs,
    { rejectValue: string }
>("quality/create", async ({ tab, payload }, { rejectWithValue }) => {
    try {
        const res = await axios.post(`/api/quality?tab=${tab}`, payload);
        return { tab, item: res.data.data };
    } catch (err: any) {
        return rejectWithValue(
            err.response?.data?.message || "Create failed"
        );
    }
});

export const updateQuality = createAsyncThunk<
    { tab: QualityTab; item: QualityItem },
    MutateQualityArgs,
    { rejectValue: string }
>("quality/update", async ({ tab, id, payload }, { rejectWithValue }) => {
    try {
        const res = await axios.put(
            `/api/quality/${id}?tab=${tab}`,
            payload
        );
        return { tab, item: res.data.data };
    } catch (err: any) {
        return rejectWithValue(
            err.response?.data?.message || "Update failed"
        );
    }
});

export const deleteQuality = createAsyncThunk<
    { tab: QualityTab; id: string },
    MutateQualityArgs,
    { rejectValue: string }
>("quality/delete", async ({ tab, id }, { rejectWithValue }) => {
    try {
        await axios.delete(`/api/quality/${id}?tab=${tab}`);
        return { tab, id: id! };
    } catch (err: any) {
        return rejectWithValue(
            err.response?.data?.message || "Delete failed"
        );
    }
});


/* ===================== STATE ===================== */

interface QualityState {
    activeTab: QualityTab;
    data: Record<QualityTab, QualityItem[]>;
    loading: boolean;
    error: string | null;
}

const initialState: QualityState = {
    activeTab: "checks",
    data: {
        checks: [],
        "control-points": [],
        alerts: [],
        teams: [],
        tags: [],
    },
    loading: false,
    error: null,
};
const qualitySlice = createSlice({
    name: "quality",
    initialState,
    reducers: {
        setActiveTab(state, action: PayloadAction<QualityTab>) {
            state.activeTab = action.payload;
        },
        clearError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder

            // FETCH
            .addCase(fetchQualityByTab.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchQualityByTab.fulfilled, (state, action) => {
                state.loading = false;
                state.data[action.payload.tab] = action.payload.items;
            })
            .addCase(fetchQualityByTab.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload ?? "Fetch error";
            })

            // CREATE
            .addCase(createQuality.fulfilled, (state, action) => {
                state.data[action.payload.tab].unshift(action.payload.item);
            })

            // UPDATE
            .addCase(updateQuality.fulfilled, (state, action) => {
                const list = state.data[action.payload.tab];
                const index = list.findIndex(
                    (i) => i._id === action.payload.item._id
                );
                if (index !== -1) list[index] = action.payload.item;
            })

            // DELETE
            .addCase(deleteQuality.fulfilled, (state, action) => {
                state.data[action.payload.tab] = state.data[
                    action.payload.tab
                ].filter((i) => i._id !== action.payload.id);
            });
    },
});

export const { setActiveTab, clearError } = qualitySlice.actions;
export default qualitySlice.reducer;

/* ===================== SELECTORS ===================== */

export const selectQualityState = (state: RootState) => state.quality;
export const selectActiveTab = (state: RootState) =>
    state.quality.activeTab;
export const selectQualityByTab = (tab: QualityTab) => (state: RootState) =>
    state.quality.data[tab];
