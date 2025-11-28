// src/redux/slices/activityCostSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosApi from "@/utils/axiosApi"; // <-- your axios instance

interface ActivityCost {
    key: string;
    activity: string;
    planned: number;
    actual: number;
    variance: number;
    variancePct: number;
    rawItems: any[];
}

interface Totals {
    planned: number;
    actual: number;
    variance: number;
    variancePct: number;
}

interface ActivityCostState {
    activities: ActivityCost[];
    totals: Totals;
    loading: boolean;
    error: string | null;
}

const initialState: ActivityCostState = {
    activities: [],
    totals: { planned: 0, actual: 0, variance: 0, variancePct: 0 },
    loading: false,
    error: null,
};

// ---------------------------------------------------------
// FETCH ACTIVITY COST DATA WITH OPTION A LOGIC
// ---------------------------------------------------------

export const fetchActivityCost = createAsyncThunk(
    "activityCost/fetch",
    async (projectId: string, { rejectWithValue }) => {
        try {
            // Fetch project, WBS, budgets
            const [projectRes, wbsRes, budgetRes] = await Promise.all([
                axiosApi.get(`/project/${projectId}`),
                axiosApi.get(`/wbs/get/${projectId}`),
                axiosApi.get(`/budget/project/${projectId}`),
            ]);

            const project = projectRes.data?.data || projectRes.data;
            const wbs = wbsRes.data?.data || wbsRes.data || [];
            const budgets = budgetRes.data?.data || budgetRes.data || [];

            // 🟦 Option A Calculation
            const totalActivities = wbs.length || 1;
            const plannedPerActivity = Number(project.budget || 0) / totalActivities;

            const map: Record<string, ActivityCost> = {};

            wbs.forEach((w: any) => {
                const budgetItems = budgets.filter(
                    (b: any) => String(b.wbsId) === String(w._id)
                );

                const actual = budgetItems.reduce(
                    (sum: number, b: any) => sum + Number(b.actualAmount || 0),
                    0
                );

                const planned = plannedPerActivity;

                map[String(w._id)] = {
                    key: String(w._id),
                    activity: w.name || w.title || "Activity",
                    planned,
                    actual,
                    variance: actual - planned,
                    variancePct: planned ? ((actual - planned) / planned) * 100 : 0,
                    rawItems: budgetItems,
                };
            });

            const activities = Object.values(map);

            const totals = {
                planned: activities.reduce((s, a) => s + a.planned, 0),
                actual: activities.reduce((s, a) => s + a.actual, 0),
                variance: activities.reduce((s, a) => s + a.variance, 0),
                variancePct: 0,
            };

            totals.variancePct = totals.planned
                ? (totals.variance / totals.planned) * 100
                : 0;

            return { activities, totals };
        } catch (err: any) {
            console.log("Activity Cost Error:", err.response?.data || err);
            return rejectWithValue(
                err.response?.data?.message || "Failed to load activity cost data"
            );
        }
    }
);

// ---------------------------------------------------------
// SLICE
// ---------------------------------------------------------

const activityCostSlice = createSlice({
    name: "activityCost",
    initialState,
    reducers: {
        clearActivityCostError(state) {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // pending
            .addCase(fetchActivityCost.pending, (state) => {
                state.loading = true;
                state.error = null;
            })

            // success
            .addCase(fetchActivityCost.fulfilled, (state, action) => {
                state.loading = false;
                state.activities = action.payload.activities;
                state.totals = action.payload.totals;
            })

            // failed
            .addCase(fetchActivityCost.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearActivityCostError } = activityCostSlice.actions;

export default activityCostSlice.reducer;
