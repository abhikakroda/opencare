import { apiUrl } from '../config';

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

export const api = {
  async get<T>(path: string, token?: string): Promise<T> {
    const response = await fetch(`${apiUrl}${path}`, {
      headers: buildHeaders(token, false),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    return response.json();
  },
  async post<T>(path: string, payload: unknown, token?: string): Promise<T> {
    const response = await fetch(`${apiUrl}${path}`, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    return response.json();
  },
  async patch<T>(path: string, payload: unknown, token?: string): Promise<T> {
    const response = await fetch(`${apiUrl}${path}`, {
      method: 'PATCH',
      headers: buildHeaders(token),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    return response.json();
  },
  async upload<T>(path: string, formData: FormData, token?: string): Promise<T> {
    const response = await fetch(`${apiUrl}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response));
    }

    return response.json();
  },
};
