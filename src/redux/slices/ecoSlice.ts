import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosApi from "@/utils/axiosApi";

/* ================= TYPES ================= */

export interface Eco {
    _id: string;
    ecoNumber: string;
    product: string;
    type: string;
    description: string;
    priority: string;
    stage: string;
    requestedBy: string;
    location: string;
    effectiveDate: string;
}

interface EcoState {
    ecos: Eco[];
    loading: boolean;
    error: string | null;
}

/* ================= INITIAL STATE ================= */

const initialState: EcoState = {
    ecos: [],
    loading: false,
    error: null,
};

/* ================= THUNKS ================= */


export const fetchEcos = createAsyncThunk(
    "ecos/fetchByOrganisation",
    async (_, { rejectWithValue }) => {
        try {
            const organisationId = localStorage.getItem("organisationId");

            if (!organisationId) {
                return rejectWithValue("Organisation not selected");
            }

            const res = await axiosApi.get(
                `/get/eco?organisationId=${organisationId}`
            );

            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || "Fetch failed");
        }
    }
);

/* ================= CREATE ECO ================= */

export const createEco = createAsyncThunk(
    "ecos/create",
    async (payload: any, { rejectWithValue }) => {
        try {
            const organisationId = localStorage.getItem("organisationId");

            const res = await axiosApi.post("/create/eco", {
                ...payload,
                organisationId,
            });

            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || "Create failed");
        }
    }
);
/* UPDATE ECO */
export const updateEco = createAsyncThunk(
    "ecos/update",
    async (
        { id, data }: { id: string; data: Partial<Eco> },
        { rejectWithValue }
    ) => {
        try {
            const res = await axiosApi.put(`/eco/update/${id}`, data);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || "Update failed");
        }
    }
);

/* DELETE ECO (SOFT DELETE) */
export const deleteEco = createAsyncThunk(
    "ecos/delete",
    async (id: string, { rejectWithValue }) => {
        try {
            await axiosApi.delete(`/eco/delete/${id}`);
            return id;
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || "Delete failed");
        }
    }
);

/* ================= SLICE ================= */

const ecoSlice = createSlice({
    name: "ecos",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder

            /* ========== FETCH ========== */
            .addCase(fetchEcos.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEcos.fulfilled, (state, action) => {
                state.loading = false;
                state.ecos = action.payload;
            })
            .addCase(fetchEcos.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            })

            /* ========== CREATE ========== */
            .addCase(createEco.pending, (state) => {
                state.loading = true;
            })
            .addCase(createEco.fulfilled, (state, action) => {
                state.loading = false;
                state.ecos.unshift(action.payload);
            })
            .addCase(createEco.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            })

            /* ========== UPDATE ========== */
            .addCase(updateEco.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateEco.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.ecos.findIndex(
                    (eco) => eco._id === action.payload._id
                );
                if (index !== -1) {
                    state.ecos[index] = action.payload;
                }
            })
            .addCase(updateEco.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            })

            /* ========== DELETE ========== */
            .addCase(deleteEco.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteEco.fulfilled, (state, action) => {
                state.loading = false;
                state.ecos = state.ecos.filter(
                    (eco) => eco._id !== action.payload
                );
            })
            .addCase(deleteEco.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default ecoSlice.reducer;
