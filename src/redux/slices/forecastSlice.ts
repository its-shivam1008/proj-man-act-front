import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosApi from "@/utils/axiosApi";
import { toast } from "sonner";

export interface Forecast {
    _id: string;
    productId: string;
    currentStock: number;
    demandForecast: number;
    suggestedReplenishment: number;
    leadTime: number;
    priority: "low" | "medium" | "high" | "critical";
    replenishmentRule: "automatic" | "manual";
    organisationId: string;
}

interface ForecastState {
    items: Forecast[];
    selected: Forecast | null;
    loading: boolean;
    error: string | null;
    pricePrediction: any | null;     // <-- added
}

const initialState: ForecastState = {
    items: [],
    selected: null,
    loading: false,
    error: null,
    pricePrediction: null          // <-- now valid
};

export const fetchPredictedRate = createAsyncThunk(
    "forecast/fetchPredictedRate",
    async (itemId: string, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem("token");

            const res = await axiosApi.get(`/forecast/predict-rate/${itemId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // axios returns data directly — NO res.json()
            const data = res.data;

            if (!data.success) {
                return rejectWithValue(data.message || "Prediction failed");
            }

            return data; // { previousPrice, lastPrice, predictedNextPrice }
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);


export const createForecast = createAsyncThunk(
    "forecast/create",
    async (data: any, { rejectWithValue }) => {
        try {
            const res = await axiosApi.post("/forecast/create", data);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const getForecasts = createAsyncThunk(
    "forecast/getAll",
    async (_, { rejectWithValue }) => {
        try {
            const res = await axiosApi.get("/forecast/get/all");
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

export const getForecastById = createAsyncThunk(
    "forecast/getSingle",
    async (id: string, { rejectWithValue }) => {
        try {
            const res = await axiosApi.get(`/forecast/single/${id}`);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


export const updateForecast = createAsyncThunk(
    "forecast/update",
    async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
        try {
            const res = await axiosApi.put(`/forecast/update/${id}`, data);
            return res.data.data;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);


export const deleteForecast = createAsyncThunk(
    "forecast/delete",
    async (id: string, { rejectWithValue }) => {
        try {
            await axiosApi.delete(`/forecast/delete/${id}`);
            return id;
        } catch (err: any) {
            return rejectWithValue(err.response?.data || err.message);
        }
    }
);

const forecastSlice = createSlice({
    name: "forecast",
    initialState,
    reducers: {
        clearSelectedForecast: (state) => {
            state.selected = null;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(createForecast.pending, (state) => {
                state.loading = true;
            })
            .addCase(createForecast.fulfilled, (state, action) => {
                state.loading = false;
                state.items.push(action.payload);

                toast.success("Forecast rule added successfully");
            })
            .addCase(createForecast.rejected, (state, action) => {
                state.loading = false;
                toast.error("Failed to add forecast");
                state.error = action.payload as string;
            })
            .addCase(getForecasts.pending, (state) => {
                state.loading = true;
            })
            .addCase(getForecasts.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(getForecasts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(getForecastById.fulfilled, (state, action) => {
                state.selected = action.payload;
            })
            .addCase(updateForecast.fulfilled, (state, action) => {
                state.items = state.items.map((item) =>
                    item._id === action.payload._id ? action.payload : item
                );

                toast.success("Forecast updated successfully");
            })
            .addCase(updateForecast.rejected, (state, action) => {
                toast.error("Failed to update forecast");
                state.error = action.payload as string;
            })
            .addCase(deleteForecast.fulfilled, (state, action) => {
                state.items = state.items.filter((item) => item._id !== action.payload);

                toast.success("Forecast deleted");
            })
            .addCase(fetchPredictedRate.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchPredictedRate.fulfilled, (state, action) => {
                state.loading = false;
                state.pricePrediction = action.payload;
            })
            .addCase(fetchPredictedRate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

    },
});

export const { clearSelectedForecast } = forecastSlice.actions;
export default forecastSlice.reducer;
