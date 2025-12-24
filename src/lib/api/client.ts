import axios, { InternalAxiosRequestConfig } from 'axios';
import { useLoadingStore } from '@/lib/store/loading-store';

// Extend axios config to include custom properties
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  showLoader?: boolean;
}

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9645/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to handle global loader
apiClient.interceptors.request.use((config: CustomAxiosRequestConfig) => {
  // By default, show global loader for mutations (POST, PUT, DELETE)
  // GET requests are usually handled by skeletons, so skip them unless explicitly requested
  const isMutation = ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '');

  if (config.showLoader !== false && (isMutation || config.showLoader === true)) {
    useLoadingStore.getState().incrementApiLoading();
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor for loading state, error handling and token refresh
apiClient.interceptors.response.use(
  (response) => {
    const config = response.config as CustomAxiosRequestConfig;
    const isMutation = ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '');

    if (config.showLoader !== false && (isMutation || config.showLoader === true)) {
      useLoadingStore.getState().decrementApiLoading();
    }
    return response;
  },
  async (error) => {
    const config = error.config as CustomAxiosRequestConfig;
    const isMutation = ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '');

    if (config?.showLoader !== false && (isMutation || config?.showLoader === true)) {
      useLoadingStore.getState().decrementApiLoading();
    }

    const originalRequest = error.config;

    // Skip auto-refresh for /refresh endpoint to prevent infinite loops
    const skipRefreshUrls = ['/auth/refresh'];
    const shouldSkipRefresh = skipRefreshUrls.some(url => originalRequest.url?.includes(url));

    // Handle 401 errors (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRefresh) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post('/auth/refresh');
        processQueue(null);
        isRefreshing = false;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
          window.location.href = '/auth/signin';
        }
        return Promise.reject(refreshError);
      }
    }

    const message = error.response?.data?.message || error.message || 'An error occurred';

    return Promise.reject({
      ...error,
      message,
      status: error.response?.status,
    });
  }
);

export const getAuthenticatedClient = () => apiClient;

export default apiClient;