const FUNCTION_NAME = import.meta.env.VITE_FUNCTION_NAME;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const buildUrl = (params: Record<string, string | number | boolean | undefined>) => {
  const url = new URL(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`);
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, String(params[key]));
    }
  });
  
  return url.toString();
};

const publicFetch = async (url: string) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY, // The Anon Key
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      return { data: null, error: result.error || `Error ${response.status}` };
    }

    return { data: result, error: null };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
};


export const getPublicEmployees = async (
  organisationId: string,
  page: number = 1,
  pageSize: number = 25,
  searchTerm?: string,
  locationId?: string
) => {
  if (!organisationId) return { data: null, error: "Organisation ID is required" };

  const url = buildUrl({
    type: 'employee',
    organisationId,
    page,
    pageSize,
    searchTerm,
    locationId
  });

  return await publicFetch(url);
};

export const getPublicEmployeeById = async (organisationId: string, id: string) => {
  if (!organisationId || !id) return { data: null, error: "Organisation ID and Employee ID are required" };

  const url = buildUrl({
    type: 'employee',
    organisationId,
    id
  });

  const { data, error } = await publicFetch(url);
  // The edge function returns { success: true, data: { ... } } for single items
  return { data: data?.data, error };
};


export const getPublicLabours = async (
  organisationId: string,
  page: number = 1,
  pageSize: number = 25,
  searchTerm?: string,
  locationId?: string,
  status?: 'active' | 'deactivated' // Optional status filter
) => {
  if (!organisationId) return { data: null, error: "Organisation ID is required" };

  const url = buildUrl({
    type: 'labour',
    organisationId,
    page,
    pageSize,
    searchTerm,
    locationId,
    status
  });

  return await publicFetch(url);
};

export const getPublicLabourById = async (organisationId: string, id: string) => {
  if (!organisationId || !id) return { data: null, error: "Organisation ID and Labour ID are required" };

  const url = buildUrl({
    type: 'labour',
    organisationId,
    id
  });

  const { data, error } = await publicFetch(url);
  return { data: data?.data, error };
};

export const getPublicLocations = async (organisationId: string) => {
  if (!organisationId) return { data: null, error: "Organisation ID is required" };

  const url = buildUrl({
    type: 'location',
    organisationId
  });

  const { data, error } = await publicFetch(url);
  // The edge function returns { success: true, data: [...] }
  return { data: data?.data, error };
};

export const getPublicLocationById = async (organisationId: string, id: string) => {
  if (!organisationId || !id) return { data: null, error: "Organisation ID and Location ID are required" };

  const url = buildUrl({
    type: 'location',
    organisationId,
    id
  });

  const { data, error } = await publicFetch(url);
  return { data: data?.data, error };
};