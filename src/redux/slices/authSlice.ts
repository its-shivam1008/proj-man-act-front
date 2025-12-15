import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { removeBearerTokenForEveryAxiosCall, setBearerTokenForEveryAxiosCall } from "@/utils/axiosApi";
import api from "@/utils/axiosApi";

const getStoredToken = () => localStorage.getItem("token") || null;
// Helper to safely parse the user profile object
const getStoredUserProfile = () => {
  const stored = localStorage.getItem("userProfile");
  try {
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
};
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
      localStorage.setItem("userProfile", JSON.stringify(res.data.user));

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
      localStorage.setItem("userProfile", JSON.stringify(res.data.user));

      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || "Invalid Credentials");
    }
  }
);
const getStoredEmail = () => localStorage.getItem("email") || null;
const authSlice = createSlice({
  name: "auth",
  initialState: {
    organisationId: getStoredOrganisationId(),
    token: getStoredToken(),
    email: getStoredEmail(),     
    loading: false,
    error: null,
    isAuthenticated: !!getStoredToken(),
    emailForVerification: null,
    userProfile:getStoredUserProfile()
  },

  reducers: {
    logout: (state) => {
      state.organisationId = null;
      state.token = null;
      state.isAuthenticated = false;

      removeBearerTokenForEveryAxiosCall();
      localStorage.clear();
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUserProfile: (state, action) => {
      if (action.payload.updatedUser) {
        state.userProfile = action.payload.updatedUser;
        state.organisationId = action.payload.updatedUser.organisationId;
        
        // Update localStorage as well
        localStorage.setItem("userProfile", JSON.stringify(action.payload.updatedUser));
        localStorage.setItem("organisationId", action.payload.updatedUser.organisationId);
      }
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
        state.organisationId = action.payload.organisationId;
        state.isAuthenticated = true;
        state.email = action.payload.email;  // Save in Redux

        // SAVE IN LOCAL STORAGE
        localStorage.setItem("email", action.payload.email);

        setBearerTokenForEveryAxiosCall(action.payload.token);
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
        state.organisationId = action.payload.organisationId;
        state.isAuthenticated = true;
        state.email = action.payload.email;
        localStorage.setItem("email", action.payload.email);
        setBearerTokenForEveryAxiosCall(action.payload.token);
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

export const { logout, clearError, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;
