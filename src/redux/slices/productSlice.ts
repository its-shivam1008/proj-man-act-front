import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosApi from "@/utils/axiosApi";

interface ProductState {
  products: any[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  products: [],
  total: 0,
  page: 1,
  limit: 10,
  loading: false,
  error: null,
};

// ✅ FETCH PRODUCTS with Pagination
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async ({ page = 1, limit = 10 }: { page: number; limit: number }) => {
    const orgId = localStorage.getItem("organisationId");

    const response = await axiosApi.get(
      `/inventory/product/all/${orgId}?page=${page}&limit=${limit}`
    );

    return response.data;
  }
);

// ✅ CREATE PRODUCT
export const addProduct = createAsyncThunk(
  "products/addProduct",
  async (data: any, { rejectWithValue }) => {
    try {
      const res = await axiosApi.post(`/inventory/product/create`, data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ✅ UPDATE PRODUCT
export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const res = await axiosApi.put(`/product/update/${id}`, data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ✅ DELETE PRODUCT
export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await axiosApi.delete(`/product/delete/${id}`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);
export const transferStock = createAsyncThunk(
  "products/transferStock",
  async (
    payload: {
      productId: string;
      fromWarehouse: string;
      toWarehouse: string;
      quantity: number;
      transportType?: string;
      vehicleNo?: string;
      driverName?: string;
      transportTime?: string;
      notes?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const res = await axiosApi.post("/inventory/stock/transfer", payload);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {},

  extraReducers: (builder) => {
    // 🔹 Fetching Products
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load products";
      });

    // 🔹 Create Product
    builder.addCase(addProduct.fulfilled, (state) => {
      // re-fetch handled in component
    });
    builder.addCase(addProduct.rejected, (state, action) => {
      state.error = (action.payload as any)?.message || action.error.message || null;
    });

    // 🔹 Update Product
    builder.addCase(updateProduct.fulfilled, (state) => {});
    builder.addCase(updateProduct.rejected, (state, action) => {
      state.error = (action.payload as any)?.message || action.error.message || null;
    });

    // 🔹 Delete Product
    builder.addCase(deleteProduct.fulfilled, (state) => {});
    builder.addCase(deleteProduct.rejected, (state, action) => {
      state.error = (action.payload as any)?.message || action.error.message || null;
    });

    // 🔹 Transfer Stock
    builder
      .addCase(transferStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(transferStock.fulfilled, (state /*, action */) => {
        state.loading = false;
      })
      .addCase(transferStock.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any)?.message || action.error.message || "Transfer failed";
      });
  },
});

export default productSlice.reducer;
