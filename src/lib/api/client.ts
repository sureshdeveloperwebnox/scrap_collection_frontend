import axios from 'axios';

// Create axios instance with base configuration
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9645/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get authenticated API client
export const getAuthenticatedClient = (token: string) => {
  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9645/api/v1',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle common errors
      if (error.response?.status === 401) {
        // Unauthorized - clear auth storage but don't redirect here
        // Let the component handle the redirect
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('auth-storage');
          } catch (error) {
            console.error('Error clearing auth storage:', error);
          }
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

  return client;
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available from Zustand store
    if (typeof window !== 'undefined') {
      try {
        // We'll get the token from the store in the component level
        // This is a fallback for direct API calls
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          const token = parsed?.state?.token;
          
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Unauthorized - clear auth storage but don't redirect here
      // Let the component handle the redirect
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('auth-storage');
        } catch (error) {
          console.error('Error clearing auth storage:', error);
        }
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

export default apiClient;