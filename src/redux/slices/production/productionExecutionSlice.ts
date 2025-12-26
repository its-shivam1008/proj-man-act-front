import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* LOGS */
export const fetchLogs = createAsyncThunk(
    "production/logs/fetch",
    async (params: { from?: string; to?: string }, { rejectWithValue }) => {
        try {
            console.log('Fetching logs with params:', params);
            const res = await axios.get("/production-execution/logs", { params });
            console.log('Logs response:', res.data);
            return res.data.data;
        } catch (error: any) {
            console.error('Error fetching logs:', error);
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const createLog = createAsyncThunk(
    "production/logs/create",
    async (data: any, { rejectWithValue }) => {
        try {
            console.log('Creating log with data:', data);
            const res = await axios.post("/production-execution/logs", data);
            console.log('Create log response:', res.data);
            return res.data.data;
        } catch (error: any) {
            console.error('Error creating log:', error);
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

/* DOWNTIME */
export const fetchDowntime = createAsyncThunk(
    "production/downtime/fetch",
    async (params: { from?: string; to?: string }, { rejectWithValue }) => {
        try {
            console.log('Fetching downtime with params:', params);
            const res = await axios.get("/production-execution/downtime", { params });
            console.log('Downtime response:', res.data);
            return res.data.data;
        } catch (error: any) {
            console.error('Error fetching downtime:', error);
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const createDowntime = createAsyncThunk(
    "production/downtime/create",
    async (data: any, { rejectWithValue }) => {
        try {
            console.log('Creating downtime with data:', data);
            const res = await axios.post("/production-execution/downtime", data);
            console.log('Create downtime response:', res.data);
            return res.data.data;
        } catch (error: any) {
            console.error('Error creating downtime:', error);
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const closeDowntime = createAsyncThunk(
    "production/downtime/close",
    async (id: string) => {
        const res = await axios.post(`/production-execution/downtime/${id}/close`);
        return res.data.data;
    }
);

/* MAINTENANCE */
export const fetchMaintenance = createAsyncThunk(
    "production/maintenance/fetch",
    async () => {
        const res = await axios.get("/production-execution/maintenance");
        return res.data.data;
    }
);

export const closeMaintenance = createAsyncThunk(
    "production/maintenance/close",
    async (id: string) => {
        const res = await axios.post(`/production-execution/maintenance/${id}/close`);
        return res.data.data;
    }
);

/* QUALITY */
export const fetchQuality = createAsyncThunk(
    "production/quality/fetch",
    async () => {
        const res = await axios.get("/production-execution/quality");
        return res.data.data;
    }
);

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
        maintenance: [],
        quality: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (b) => {
        // Specific cases MUST come before addMatcher calls
        b.addCase(fetchLogs.fulfilled, (s, a) => { s.logs = a.payload; });
        b.addCase(createLog.fulfilled, (s, a) => { s.logs = [a.payload, ...s.logs]; });
        
        b.addCase(fetchDowntime.fulfilled, (s, a) => { s.downtime = a.payload; });
        b.addCase(createDowntime.fulfilled, (s, a) => { s.downtime = [a.payload, ...s.downtime]; });
        b.addCase(closeDowntime.fulfilled, (s, a) => { 
            s.downtime = s.downtime.map((d: any) => d._id === a.payload._id ? a.payload : d);
        });
        
        b.addCase(fetchMaintenance.fulfilled, (s, a) => { s.maintenance = a.payload; });
        b.addCase(closeMaintenance.fulfilled, (s, a) => { 
            s.maintenance = s.maintenance.map((m: any) => m._id === a.payload._id ? a.payload : m);
        });
        
        b.addCase(fetchQuality.fulfilled, (s, a) => { s.quality = a.payload; });
        b.addCase(completeQuality.fulfilled, (s, a) => { 
            s.quality = s.quality.map((q: any) => q._id === a.payload._id ? a.payload : q);
        });

        // Generic matchers MUST come after all addCase calls
        b.addMatcher(
            (a) => a.type.startsWith("production/") && a.type.endsWith("/pending"),
            (s) => { 
                s.loading = true; 
                s.error = null;
            }
        );
        
        b.addMatcher(
            (a) => a.type.startsWith("production/") && a.type.endsWith("/fulfilled"),
            (s) => { 
                s.loading = false; 
            }
        );
        
        b.addMatcher(
            (a) => a.type.startsWith("production/") && a.type.endsWith("/rejected"),
            (s, a) => { 
                s.loading = false; 
                s.error = a.payload || a.error?.message || "An error occurred";
                console.error('Production execution error:', a.payload || a.error);
            }
        );
    },
});

export const { clearError } = slice.actions;
export default slice.reducer;
