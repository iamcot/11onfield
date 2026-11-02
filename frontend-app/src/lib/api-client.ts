import { ApiError } from '@/types';
import { storage } from '@/lib/storage';

/** Fired on `window` when a signed-in call is refused because the session ended; AuthContext signs out and redirects. */
export const SESSION_EXPIRED_EVENT = 'auth:session-expired';
export const SESSION_EXPIRED_MESSAGE = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';

function sentToken(options?: RequestInit): boolean {
  const h = options?.headers as Record<string, string> | undefined;
  return !!(h && (h.Authorization || h.authorization));
}

/**
 * A call that carried our token came back 401 (or 403 while the stored token is already past its expiry, from servers
 * that answer an unknown caller with 403): the session is over.
 */
function sessionEnded(response: Response, options?: RequestInit): boolean {
  if (!sentToken(options)) return false;
  if (response.status === 401) return true;
  return response.status === 403 && storage.isTokenExpired();
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async handleResponse<T>(response: Response, options?: RequestInit): Promise<T> {
    if (!response.ok && sessionEnded(response, options)) {
      storage.clearAuth();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
      const error: ApiError = { message: SESSION_EXPIRED_MESSAGE, status: 401 };
      throw error;
    }

    if (!response.ok) {
      const error: ApiError = {
        message: response.statusText,
        status: response.status,
      };

      try {
        const errorData = await response.json();
        error.message = errorData.message || error.message;
        error.errors = errorData.errors;
      } catch {
        // If response is not JSON, use statusText
      }

      throw error;
    }

    // Handle empty responses (204 No Content or empty body)
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');

    if (response.status === 204 || contentLength === '0' || !contentType?.includes('application/json')) {
      return undefined as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const { headers, ...restOptions } = options || {};
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      ...restOptions,
    });

    return this.handleResponse<T>(response, options);
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const { headers, ...restOptions } = options || {};
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
      ...restOptions,
    });

    return this.handleResponse<T>(response, options);
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const { headers, ...restOptions } = options || {};
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
      ...restOptions,
    });

    return this.handleResponse<T>(response, options);
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const { headers, ...restOptions } = options || {};
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      ...restOptions,
    });

    return this.handleResponse<T>(response, options);
  }

  async postMultipart<T>(endpoint: string, formData: FormData, options?: RequestInit): Promise<T> {
    const { headers, ...restOptions } = options || {};
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        ...headers,
        // Do NOT set Content-Type for FormData - browser sets it automatically with boundary
      },
      body: formData,
      ...restOptions,
    });

    return this.handleResponse<T>(response, options);
  }

  setAuthToken(token: string) {
    // This will be used in the auth service
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }
}

export const apiClient = new ApiClient(API_URL);
