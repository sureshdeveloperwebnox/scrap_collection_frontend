import axios from 'axios';

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9645/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies with requests
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

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip auto-refresh for /me and /refresh endpoints to prevent infinite loops
    const skipRefreshUrls = ['/auth/me', '/auth/refresh'];
    const shouldSkipRefresh = skipRefreshUrls.some(url => originalRequest.url?.includes(url));

    // Handle 401 errors (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry && !shouldSkipRefresh) {
      if (isRefreshing) {
        // If already refreshing, queue this request
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
        // Attempt to refresh the token
        await apiClient.post('/auth/refresh');

        // Token refreshed successfully, retry the original request
        processQueue(null);
        isRefreshing = false;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        processQueue(refreshError, null);
        isRefreshing = false;

        // Redirect to login page (only if not already on auth pages)
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/')) {
          window.location.href = '/auth/signin';
        }

        return Promise.reject(refreshError);
      }
    }

    // Extract error message for better UX
    const message = error.response?.data?.message || error.message || 'An error occurred';

    return Promise.reject({
      ...error,
      message,
      status: error.response?.status,
    });
  }
);

// Function to get authenticated API client (kept for backward compatibility)
// Now it just returns the main client since auth is handled via cookies
export const getAuthenticatedClient = () => {
  return apiClient;
};

export default apiClient;