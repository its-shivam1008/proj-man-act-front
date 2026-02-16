import { createSlice, createAsyncThunk} from "@reduxjs/toolkit";
import axios from "@/utils/axiosApi";

/* ================= ASYNC ================= */

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
export const clearChat = createAsyncThunk(
  "chat/clear",
  async (teamId: string) => {
    await axios.delete(`/messages/clear/${teamId}`);
    return teamId;
  }
);

/* ================= STATE ================= */

interface ChatState {
  messages: any[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  loading: false,
  error: null,
};

/* ================= SLICE ================= */

const chatSlice = createSlice({
 name: "chat",
  initialState,
  reducers: {
    messageReceived: (state, action) => {
      state.messages.push(action.payload);
    },

    clearLocal: (state) => {
      state.messages = [];
    },
  },
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
      }).addCase(clearChat.fulfilled, (state) => {
        state.messages = [];
      });


    // ❌ REMOVE THIS (avoid duplicate)
    /*
    .addCase(sendMessage.fulfilled, (state, action) => {
      state.messages.push(action.payload);
    });
    */
  },
});

export const { messageReceived, clearLocal } = chatSlice.actions;


export default chatSlice.reducer;
