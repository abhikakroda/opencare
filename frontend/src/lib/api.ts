import { apiUrl } from '../config';

export const ADMIN_TOKEN_STORAGE_KEY = 'opencare-admin-token';
export const ADMIN_PROFILE_STORAGE_KEY = 'opencare-admin-profile';
export const ADMIN_AUTH_EXPIRED_EVENT = 'opencare-admin-auth-expired';

const readErrorMessage = async (response: Response) => {
  try {
    const payload = await response.json();
    return payload.message ?? 'Request failed';
  } catch {
    return 'Request failed';
  }
};

const buildHeaders = (token?: string, json = true) => {
  const headers: Record<string, string> = {};

  if (json) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const handleUnauthorized = () => {
  window.localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(ADMIN_PROFILE_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(ADMIN_AUTH_EXPIRED_EVENT));
};

const readNetworkError = (error: unknown) => {
  if (error instanceof Error && error.message) {
    if (error.message === 'Failed to fetch' || error.message === 'Load failed') {
      const isLocalApp =
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

      return isLocalApp
        ? 'Cannot connect to the backend right now. Check that the API server is running on localhost:4000.'
        : 'Cannot connect right now. Please try again in a moment.';
    }

    return error.message;
  }

  return 'Request failed';
};

const throwForResponse = async (response: Response) => {
  if (response.ok) {
    return;
  }

  if (response.status === 401) {
    handleUnauthorized();
  }

  throw new Error(await readErrorMessage(response));
};

const request = async (input: RequestInfo | URL, init?: RequestInit) => {
  try {
    return await fetch(input, init);
  } catch (error) {
    throw new Error(readNetworkError(error));
  }
};

export const api = {
  async get<T>(path: string, token?: string): Promise<T> {
    const response = await request(`${apiUrl}${path}`, {
      headers: buildHeaders(token, false),
    });

    await throwForResponse(response);

    return response.json();
  },
  async post<T>(path: string, payload: unknown, token?: string): Promise<T> {
    const response = await request(`${apiUrl}${path}`, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    });

    await throwForResponse(response);

    return response.json();
  },
  async patch<T>(path: string, payload: unknown, token?: string): Promise<T> {
    const response = await request(`${apiUrl}${path}`, {
      method: 'PATCH',
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    });

    await throwForResponse(response);

    return response.json();
  },
  async upload<T>(path: string, formData: FormData, token?: string): Promise<T> {
    const response = await request(`${apiUrl}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    await throwForResponse(response);

    return response.json();
  },
};
