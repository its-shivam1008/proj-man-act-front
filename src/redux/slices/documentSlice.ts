import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosApi from "@/utils/axiosApi";

/* ================= TYPES ================= */

export interface DocumentItem {
  _id: string;
  documentName: string;
  type: "drawing" | "specification" | "cad" | "other";
  description?: string;
  fileUrl: string;
  version?: string;
  uploadedBy: string;
  location?: string;
  linkedTo?: {
    type: string;
    id: string;
  };
  size: number;
  createdAt: string;
}

/* ================= STATE ================= */

interface DocumentState {
  documents: DocumentItem[];
  loading: boolean;
  error: string | null;

  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const initialState: DocumentState = {
  documents: [],
  loading: false,
  error: null,

  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

/* ================= THUNKS ================= */

/* Fetch documents (pagination + filters) */
export const fetchDocuments = createAsyncThunk(
  "documents/fetch",
  async (
    params: {
      page?: number;
      limit?: number;
      search?: string;
      type?: string;
      location?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosApi.get("/documents/get", { params });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

/* Upload document */
export const uploadDocument = createAsyncThunk(
  "documents/upload",
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const res = await axiosApi.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

/* Update document metadata */
export const updateDocument = createAsyncThunk(
  "documents/update",
  async (
    { id, data }: { id: string; data: Partial<DocumentItem> },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosApi.put(`/documents/updatedoc/${id}`, data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

/* Link / unlink document */
export const linkDocument = createAsyncThunk(
  "documents/link",
  async (
    { id, linkedTo }: { id: string; linkedTo: any },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosApi.put(`/documents/${id}/link`, linkedTo);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

/* Soft delete */
export const deleteDocument = createAsyncThunk(
  "documents/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await axiosApi.delete(`/documents/delete/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message);
    }
  }
);

/* ================= SLICE ================= */

const documentSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    builder

      /* FETCH */
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload.data;
        state.total = action.payload.pagination.total;
        state.page = action.payload.pagination.page;
        state.limit = action.payload.pagination.limit;
        state.totalPages = action.payload.pagination.totalPages;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* UPLOAD */
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.documents.unshift(action.payload);
      })

      /* UPDATE / LINK */
      .addCase(updateDocument.fulfilled, (state, action) => {
        const index = state.documents.findIndex(
          (d) => d._id === action.payload._id
        );
        if (index !== -1) state.documents[index] = action.payload;
      })
      .addCase(linkDocument.fulfilled, (state, action) => {
        const index = state.documents.findIndex(
          (d) => d._id === action.payload._id
        );
        if (index !== -1) state.documents[index] = action.payload;
      })

      /* DELETE (SOFT) */
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter(
          (d) => d._id !== action.payload
        );
      });
  },
});

export default documentSlice.reducer;
