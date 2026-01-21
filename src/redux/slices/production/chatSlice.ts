import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

export const fetchMessages = createAsyncThunk(
  "chat/fetch",
  async (teamId: string) => {
    const res = await axios.get(`/messages/${teamId}`);
    return res.data;
  }
);

export const sendMessage = createAsyncThunk(
  "chat/send",
  async ({ teamId, message }: { teamId: string; message: string }) => {
    const res = await axios.post("/messages", { teamId, message });
    return res.data;
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    messages: [] as any[],
    loading: false,
    error: null as string | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load messages";
      })

      // SEND
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      });
  },
});

export default chatSlice.reducer;
