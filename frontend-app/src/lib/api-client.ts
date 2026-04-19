import { ApiError } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
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

    return this.handleResponse<T>(response);
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

    return this.handleResponse<T>(response);
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

    return this.handleResponse<T>(response);
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

    return this.handleResponse<T>(response);
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

    return this.handleResponse<T>(response);
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
