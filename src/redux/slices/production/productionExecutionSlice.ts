import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* LOGS */
export const fetchLogs = createAsyncThunk(
    "production/logs/fetch",
    async (params: { from?: string; to?: string }) => {
        const res = await axios.get("/production-execution/logs", { params });
        return res.data.data;
    }
);

export const createLog = createAsyncThunk(
    "production/logs/create",
    async (data: any) => {
        const res = await axios.post("/production-execution/logs", data);
        return res.data.data;
    }
);

/* DOWNTIME */
export const createDowntime = createAsyncThunk(
    "production/downtime/create",
    async (data: any) => {
        const res = await axios.post("/production-execution/downtime", data);
        return res.data.data;
    }
);

export const closeDowntime = createAsyncThunk(
    "production/downtime/close",
    async (id: string) => {
        const res = await axios.post(`/production-execution/downtime/${id}/close`);
        return res.data.data;
    }
);

/* QUALITY */
export const completeQuality = createAsyncThunk(
    "production/quality/complete",
    async ({ id, status, remarks }: any) => {
        const res = await axios.post(`/production-execution/quality/${id}/complete`, {
            status,
            remarks,
        });
        return res.data.data;
    }
);

/* ATTENDANCE */
export const markAttendance = createAsyncThunk(
    "production/attendance",
    async (data: any) => {
        const res = await axios.post("/production-execution/attendance", data);
        return res.data.data;
    }
);

const slice = createSlice({
    name: "productionExecution",
    initialState: {
        logs: [],
        downtime: [],
        quality: [],
        loading: false,
    },
    reducers: {},
    extraReducers: (b) => {
        b.addMatcher(
            (a) => a.type.startsWith("production/") && a.type.endsWith("/pending"),
            (s) => { s.loading = true; }
        );
        b.addMatcher(
            (a) => a.type.startsWith("production/") && a.type.endsWith("/fulfilled"),
            (s) => { s.loading = false; }
        );
        b.addCase(fetchLogs.fulfilled, (s, a) => { s.logs = a.payload; });
    },
});

export default slice.reducer;
