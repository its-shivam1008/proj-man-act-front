import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { BASE_URL } from "@/utils/constants";
import { removeBearerTokenForEveryAxiosCall, setBearerTokenForEveryAxiosCall } from "@/utils/axiosApi";
import api from "@/utils/axiosApi";

const getStoredToken = () => localStorage.getItem("token") || null;
const getStoredOrganisationId = () => localStorage.getItem("organisationId") || null;

export const signupUser = createAsyncThunk(
  "auth/signupUser",
  async ({ fullname, email, password }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/auth/signup`, {
        fullname,
        email,
        password,
      });

      if (res.data.organisationId) {
        localStorage.setItem("organisationId", res.data.organisationId);
      }

      // No token returned at signup (correct)
      return res.data;  
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || "Signup Failed");
    }
  }
);



export const verifyOtpUser = createAsyncThunk(
  "auth/verifyOtpUser",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/auth/verify-otp`, { email, otp });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("organisationId", res.data.organisationId); 

      return res.data; 
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "OTP Verification Failed");
    }
  }
);

export const resendOtpUser = createAsyncThunk(
  "auth/resendOtpUser",
  async (email, { rejectWithValue }) => {
    try {
      const res = await api.post(`/auth/resend-otp`, { email });
      return res.data; // { message }
    } catch (err) {
      return rejectWithValue("Failed to resend OTP");
    }
  }
);


export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post(`/auth/login`, formData);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("organisationId", res.data.organisationId);

      return res.data; 
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Invalid Credentials");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    organisationId: getStoredOrganisationId(),
    token: getStoredToken(),
    loading: false,
    error: null,
    isAuthenticated: !!getStoredToken(),
    emailForVerification: null, // storing email after signup
  },

  reducers: {
    logout: (state) => {
      state.organisationId = null;
      state.token = null;
      state.isAuthenticated = false;

      removeBearerTokenForEveryAxiosCall();
      localStorage.removeItem("token");
      localStorage.removeItem("organisationId");
    },
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(signupUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.loading = false;
        state.emailForVerification = action.payload.email; // used for OTP page
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      .addCase(verifyOtpUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtpUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        setBearerTokenForEveryAxiosCall(action.payload.token)
        state.organisationId = action.payload.organisationId;
        state.isAuthenticated = true;
      })
      .addCase(verifyOtpUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        setBearerTokenForEveryAxiosCall(action.payload.token)
        state.organisationId = action.payload.organisationId;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
    
      .addCase(resendOtpUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(resendOtpUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendOtpUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
