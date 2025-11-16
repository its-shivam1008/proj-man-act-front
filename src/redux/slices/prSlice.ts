import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { PurchaseRequest, PurchaseOrder } from "@/types/procurement";
import { BASE_URL } from "@/utils/constants";
import api from "@/utils/axiosApi";

interface ConvertResponse {
  pr: PurchaseRequest;
  po: PurchaseOrder;
}

export const convertToPR = createAsyncThunk<ConvertResponse, { mrsIds: string[]; supplier?: string; deliveryDate?: string }>(
  "pr/convertToPR",
  async (data, { rejectWithValue }) => {
    console.log('Sending to /pr/po/convert:', data); // Debug: Check mrsIds is array
    try {
      const res = await api.post(`/pr/po/convert`, data);
      return res.data as ConvertResponse;
    } catch (err: any) {
      console.error('Convert PR Error:', err.response?.data); // Log full { message, errors }
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

interface PRState {
  list: PurchaseRequest[];
  loading: boolean;
}

const initialState: PRState = {
  list: [],
  loading: false,
};

const prSlice = createSlice({
  name: "pr",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder.addCase(convertToPR.fulfilled, (state, action) => {
      state.list.push(action.payload.pr);
    });
  },
});

export default prSlice.reducer;
