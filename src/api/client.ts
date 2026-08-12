import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types/api';

const API_BASE_URL = 'https://v1.apishoky.tech/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};

// Request Interceptor: Attach Access Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem('shoky_access_token');
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Token Refresh & Error Normalization
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<any>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Avoid infinite loop on auth endpoints
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('shoky_refresh_token');

      if (!refreshToken) {
        isRefreshing = false;
        handleLogout();
        return Promise.reject(error);
      }

      try {
        const refreshResponse = await axios.post<ApiResponse<{ accessToken: string }>>(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken }
        );

        const newAccessToken = refreshResponse.data.data?.accessToken;

        if (newAccessToken) {
          localStorage.setItem('shoky_access_token', newAccessToken);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          
          processQueue(null, newAccessToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return apiClient(originalRequest);
        } else {
          throw new Error('Refresh failed: No token returned');
        }
      } catch (refreshErr) {
        processQueue(refreshErr as AxiosError, null);
        handleLogout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(extractApiErrorMessage(error));
  }
);

export function handleLogout() {
  localStorage.removeItem('shoky_access_token');
  localStorage.removeItem('shoky_refresh_token');
  localStorage.removeItem('shoky_user');
  window.dispatchEvent(new Event('shoky-logout'));
}

export function extractApiErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) {
    const msg = error.response.data.message;
    return Array.isArray(msg) ? msg[0] : msg;
  }
  if (error?.message) return error.message;
  return 'An unexpected error occurred. Please try again.';
}
