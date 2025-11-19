import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/axiosApi";
import { toast } from "sonner";

export interface Product {
  _id?: string;
  organisationId?: string;
  name: string;
  sku: string;
  category: string;
  unitCost: number;
  quantity: number;
  minStock: number;
  location: string;
  status: "in-stock" | "low-stock" | "out-of-stock";
}

interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  products: [],
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk(
  "products/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const orgId = localStorage.getItem("organisationId");
      if (!orgId) {
        toast.error("No organisationId found");
        return rejectWithValue("No organisationId found");
      }

      const res = await api.get(`/product/all/${orgId}`);

      return res.data.products;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to fetch products";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const addProduct = createAsyncThunk(
  "products/add",
  async (data: Product, { rejectWithValue }) => {
    try {
      const res = await api.post(`/product/create`, data);
      toast.success("Product added successfully");
      return res.data.product;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to add product";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const updateProduct = createAsyncThunk(
  "products/update",
  async (
    { id, data }: { id: string; data: Partial<Product> },
    { rejectWithValue }
  ) => {
    try {
      const res = await api.put(`/product/update/${id}`, data);
      toast.success("Product updated");
      return res.data.product;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to update product";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  "products/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/product/delete/${id}`);
      toast.success("Product deleted");
      return id;
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to delete product";
      toast.error(msg);
      return rejectWithValue(msg);
    }
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // FETCH
    builder.addCase(fetchProducts.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchProducts.fulfilled, (state, action) => {
      state.loading = false;
      state.products = action.payload || [];
    });
    builder.addCase(fetchProducts.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ADD
    builder.addCase(addProduct.fulfilled, (state, action) => {
      state.products.unshift(action.payload);
    });

    // UPDATE
    builder.addCase(updateProduct.fulfilled, (state, action) => {
      state.products = state.products.map((p) =>
        p._id === action.payload._id ? action.payload : p
      );
    });

    // DELETE
    builder.addCase(deleteProduct.fulfilled, (state, action) => {
      state.products = state.products.filter((p) => p._id !== action.payload);
    });
  },
});

export default productsSlice.reducer;
