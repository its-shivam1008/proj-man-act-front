import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/utils/axiosApi';

export interface MaterialRequest {
  _id: string;
  organisationId: string;
  itemId: string;
  item: string;
  sourceTask: string;
  quantity: number;
  unit: string;
  requiredDate?: string;
  sentDate: string;
  projectId?: string;
  projectName?: string;
  remark?: string;
  status: 'ready' | 'in-transit' | 'delivered' | 'cancelled' | 'rejected';
  acceptedAt: string;
  acceptedBy?: string;
  deliveryDetails?: {
    transportType?: string;
    vehicleNo?: string;
    driverName?: string;
    transportCost?: number;
    estimatedDeliveryDate?: string;
    actualDeliveryDate?: string;
    deliveryNotes?: string;
  };
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface MaterialRequestState {
  requests: MaterialRequest[];
  loading: boolean;
  error: string | null;
  statistics: {
    total: number;
    ready: number;
    'in-transit': number;
    delivered: number;
    cancelled: number;
    rejected: number;
  }
}
type MaterialRequestStatus =
  | 'ready'
  | 'in-transit'
  | 'delivered'
  | 'cancelled'
  | 'rejected';
const initialState: MaterialRequestState = {
  requests: [],
  loading: false,
  error: null,
  statistics: {
    total: 0,
    ready: 0,
    'in-transit': 0,
    delivered: 0,
    cancelled: 0,
    rejected: 0,
  },

};

// Async thunks
export const fetchMaterialRequests = createAsyncThunk(
  'materialRequests/fetchAll',
  async (params: { page?: number; limit?: number; status?: string; projectId?: string } = {}) => {
    const organisationId = localStorage.getItem('organisationId');
    const response = await api.get('/api/material-requests', {
      params,
      headers: { organisationId }
    });
    return response.data;
  }
);

export const createMaterialRequest = createAsyncThunk(
  'materialRequests/create',
  async (requestData: Partial<MaterialRequest>) => {
    const organisationId = localStorage.getItem('organisationId');
    const response = await api.post('/api/material-requests', requestData, {
      headers: { organisationId }
    });
    return response.data.data;
  }
);

export const updateMaterialRequest = createAsyncThunk(
  'materialRequests/update',
  async ({ id, data }: { id: string; data: Partial<MaterialRequest> }) => {
    const organisationId = localStorage.getItem('organisationId');
    const response = await api.put(`/api/material-requests/${id}`, data, {
      headers: { organisationId }
    });
    return response.data.data;
  }
);

export const updateMaterialRequestStatus = createAsyncThunk(
  'materialRequests/updateStatus',
  async ({ id, status, deliveryDetails }: {
    id: string;
    status: MaterialRequestStatus;
    deliveryDetails?: any
  }) => {
    const organisationId = localStorage.getItem('organisationId');
    const response = await api.patch(`/api/material-requests/${id}/status`, {
      status,
      deliveryDetails
    }, {
      headers: { organisationId }
    });
    return response.data.data;
  }
);

export const deleteMaterialRequest = createAsyncThunk(
  'materialRequests/delete',
  async (id: string) => {
    const organisationId = localStorage.getItem('organisationId');
    await api.delete(`/api/material-requests/${id}`, {
      headers: { organisationId }
    });
    return id;
  }
);

export const fetchMaterialRequestStatistics = createAsyncThunk(
  'materialRequests/fetchStatistics',
  async () => {
    const organisationId = localStorage.getItem('organisationId');
    const response = await api.get('/api/material-requests-stats', {
      headers: { organisationId }
    });
    return response.data.data;
  }
);

export const bulkCreateMaterialRequests = createAsyncThunk(
  'materialRequests/bulkCreate',
  async (requests: Partial<MaterialRequest>[]) => {
    const organisationId = localStorage.getItem('organisationId');
    const response = await api.post('/api/material-requests/bulk', {
      requests
    }, {
      headers: { organisationId }
    });
    return response.data.data;
  }
);

// Migration function to move localStorage data to database
export const migrateMaterialRequestsFromLocalStorage = createAsyncThunk(
  'materialRequests/migrate',
  async () => {
    const organisationId = localStorage.getItem('organisationId');
    const localStorageData = localStorage.getItem('MATERIAL_REQUESTS');

    if (!localStorageData) {
      return [];
    }

    const requests = JSON.parse(localStorageData);

    if (requests.length === 0) {
      return [];
    }

    // Add organisationId to all requests
    const requestsWithOrgId = requests.map((req: any) => ({
      ...req,
      organisationId,
      // Ensure required fields have defaults
      status: req.status || 'ready',
      acceptedAt: req.acceptedAt || new Date().toISOString(),
      sentDate: req.sentDate || new Date().toISOString(),
    }));

    const response = await api.post('/api/material-requests/bulk', {
      requests: requestsWithOrgId
    }, {
      headers: { organisationId }
    });

    // Clear localStorage after successful migration
    localStorage.removeItem('MATERIAL_REQUESTS');

    return response.data.data;
  }
);

const materialRequestSlice = createSlice({
  name: 'materialRequests',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch material requests
      .addCase(fetchMaterialRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaterialRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.requests || action.payload;
      })
      .addCase(fetchMaterialRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch material requests';
      })

      // Create material request
      .addCase(createMaterialRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMaterialRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.requests.unshift(action.payload);
      })
      .addCase(createMaterialRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create material request';
      })

      // Update material request
      .addCase(updateMaterialRequest.fulfilled, (state, action) => {
        const index = state.requests.findIndex(req => req._id === action.payload._id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
      })

      // Update status
      .addCase(updateMaterialRequestStatus.fulfilled, (state, action) => {
        const index = state.requests.findIndex(req => req._id === action.payload._id);
        if (index !== -1) {
          state.requests[index] = action.payload;
        }
      })

      // Delete material request
      .addCase(deleteMaterialRequest.fulfilled, (state, action) => {
        state.requests = state.requests.filter(req => req._id !== action.payload);
      })

      // Fetch statistics
      .addCase(fetchMaterialRequestStatistics.fulfilled, (state, action) => {
        state.statistics = action.payload;
      })

      // Bulk create
      .addCase(bulkCreateMaterialRequests.fulfilled, (state, action) => {
        state.requests = [...action.payload, ...state.requests];
      })

      // Migration
      .addCase(migrateMaterialRequestsFromLocalStorage.fulfilled, (state, action) => {
        state.requests = [...action.payload, ...state.requests];
      });
  },
});

export const { clearError, setLoading } = materialRequestSlice.actions;
export default materialRequestSlice.reducer;