import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '@/utils/axiosApi';

export interface EquipmentAllocation {
  _id: string;
  equipmentCode: string;
  equipmentName?: string;
  projectOrDept: string;
  operator: string;
  workingHours: number;
  idleHours: number;
  fuelConsumption: number;
  performanceRating: number;
  date: string;
  shift?: string;
  allocationType?: string;
  startDate?: string;
  endDate?: string;
  powerConsumption?: number;
  meterReading?: number;
  status: 'Active' | 'Completed' | 'Cancelled';
  location?: {
    _id: string;
    name: string;
  };
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentAllocationStats {
  total: number;
  active: number;
  completed: number;
  cancelled: number;
  totalWorkingHours: number;
  totalIdleHours: number;
  totalFuelConsumption: number;
  avgPerformanceRating: number;
  totalEquipmentCount: number;
  utilizationRate: number;
}

export interface UtilizationData {
  equipment: string;
  utilization: number;
}

export interface FuelData {
  equipment: string;
  fuel: number;
}

export interface TrendData {
  date: string;
  work: number;
  fuel: number;
}

interface EquipmentAllocationState {
  allocations: EquipmentAllocation[];
  stats: EquipmentAllocationStats | null;
  utilizationData: UtilizationData[];
  fuelData: FuelData[];
  trendData: TrendData[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const initialState: EquipmentAllocationState = {
  allocations: [],
  stats: null,
  utilizationData: [],
  fuelData: [],
  trendData: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  },
};

// Async thunks
export const fetchEquipmentAllocations = createAsyncThunk(
  'equipmentAllocation/fetchAll',
  async (params: any = {}) => {
    const organisationId = localStorage.getItem("organisationId");
    const queryParams = {
      ...params,
      organisationId: organisationId || "",
    };
    const response = await api.get('/equipment-allocation', { params: queryParams });
    return response.data;
  }
);

export const fetchEquipmentAllocationById = createAsyncThunk(
  'equipmentAllocation/fetchById',
  async (id: string) => {
    const response = await api.get(`/equipment-allocation/${id}`);
    return response.data;
  }
);

export const createEquipmentAllocation = createAsyncThunk(
  'equipmentAllocation/create',
  async (data: Partial<EquipmentAllocation>) => {
    const organisationId = localStorage.getItem("organisationId");
    const response = await api.post('/equipment-allocation/create', {
      ...data,
      organisationId,
    });
    return response.data;
  }
);

export const updateEquipmentAllocation = createAsyncThunk(
  'equipmentAllocation/update',
  async ({ id, data }: { id: string; data: Partial<EquipmentAllocation> }) => {
    const response = await api.put(`/equipment-allocation/${id}`, data);
    return response.data;
  }
);

export const deleteEquipmentAllocation = createAsyncThunk(
  'equipmentAllocation/delete',
  async (id: string) => {
    await api.delete(`/equipment-allocation/${id}`);
    return id;
  }
);

export const fetchEquipmentAllocationStats = createAsyncThunk(
  'equipmentAllocation/fetchStats',
  async () => {
    const organisationId = localStorage.getItem("organisationId");
    const response = await api.get(`/equipment-allocation/stats?organisationId=${organisationId}`);
    return response.data;
  }
);

export const fetchUtilizationData = createAsyncThunk(
  'equipmentAllocation/fetchUtilizationData',
  async () => {
    const organisationId = localStorage.getItem("organisationId");
    const response = await api.get(`/equipment-allocation/utilization-data?organisationId=${organisationId}`);
    return response.data;
  }
);

export const fetchFuelData = createAsyncThunk(
  'equipmentAllocation/fetchFuelData',
  async () => {
    const organisationId = localStorage.getItem("organisationId");
    const response = await api.get(`/equipment-allocation/fuel-data?organisationId=${organisationId}`);
    return response.data;
  }
);

export const fetchTrendData = createAsyncThunk(
  'equipmentAllocation/fetchTrendData',
  async () => {
    const organisationId = localStorage.getItem("organisationId");
    const response = await api.get(`/equipment-allocation/trend-data?organisationId=${organisationId}`);
    return response.data;
  }
);

export const createSampleData = createAsyncThunk(
  'equipmentAllocation/createSampleData',
  async (locationId: string) => {
    const organisationId = localStorage.getItem("organisationId");
    const response = await api.post('/equipment-allocation/sample-data', { 
      locationId,
      organisationId,
    });
    return response.data;
  }
);

const equipmentAllocationSlice = createSlice({
  name: 'equipmentAllocation',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all equipment allocations
      .addCase(fetchEquipmentAllocations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEquipmentAllocations.fulfilled, (state, action) => {
        state.loading = false;
        state.allocations = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchEquipmentAllocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch equipment allocations';
      })

      // Create equipment allocation
      .addCase(createEquipmentAllocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEquipmentAllocation.fulfilled, (state, action) => {
        state.loading = false;
        state.allocations.unshift(action.payload.data);
      })
      .addCase(createEquipmentAllocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create equipment allocation';
      })

      // Update equipment allocation
      .addCase(updateEquipmentAllocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEquipmentAllocation.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.allocations.findIndex(
          (allocation) => allocation._id === action.payload.data._id
        );
        if (index !== -1) {
          state.allocations[index] = action.payload.data;
        }
      })
      .addCase(updateEquipmentAllocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update equipment allocation';
      })

      // Delete equipment allocation
      .addCase(deleteEquipmentAllocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteEquipmentAllocation.fulfilled, (state, action) => {
        state.loading = false;
        state.allocations = state.allocations.filter(
          (allocation) => allocation._id !== action.payload
        );
      })
      .addCase(deleteEquipmentAllocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete equipment allocation';
      })

      // Fetch stats
      .addCase(fetchEquipmentAllocationStats.fulfilled, (state, action) => {
        state.stats = action.payload.data;
      })

      // Fetch utilization data
      .addCase(fetchUtilizationData.fulfilled, (state, action) => {
        state.utilizationData = action.payload.data;
      })

      // Fetch fuel data
      .addCase(fetchFuelData.fulfilled, (state, action) => {
        state.fuelData = action.payload.data;
      })

      // Fetch trend data
      .addCase(fetchTrendData.fulfilled, (state, action) => {
        state.trendData = action.payload.data;
      })

      // Create sample data
      .addCase(createSampleData.fulfilled, (state) => {
        // Refresh data after creating sample data
        state.loading = false;
      });
  },
});

export const { clearError, setPage, setLimit } = equipmentAllocationSlice.actions;
export default equipmentAllocationSlice.reducer;