import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, SignInRequest, SignUpRequest } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { getAuthenticatedClient } from '@/lib/api/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

// Hook to initialize authentication state
export const useAuthInit = () => {
  const { token, user, isAuthenticated, setLoading, setHydrated } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      try {
        // Check if we have stored auth data
        if (token && user && isAuthenticated) {
          // Verify token validity with backend
          try {
            const client = getAuthenticatedClient(token);
            await client.get('/auth/verify'); // or whatever endpoint verifies the token
            console.log('Token is valid, user is authenticated');
          } catch (error) {
            console.log('Token is invalid, clearing auth state');
            // Token is invalid, clear auth state
            localStorage.removeItem('auth-storage');
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
        setHydrated(true);
      }
    };

    initializeAuth();
  }, [token, user, isAuthenticated, setLoading, setHydrated]);
};

export const useSignIn = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { login, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: (data: SignInRequest) => authApi.signIn(data),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (response) => {
      console.log("Sign in response:", response);
      
      if (response?.data?.user && response?.data?.token) {
        // Store in Zustand store
        login(response.data.user, response.data.token);

        toast.success('Login successful!', {
          description: 'You are now logged in',
        });
        
        // Redirect to dashboard
        router.push('/dashboard');
        
        // Invalidate all queries to refresh with authenticated state
        queryClient.invalidateQueries();
      }
    },
    onError: (error: any) => {
      console.error('Sign in error:', error);
      toast.error('Login failed', {
        description: error?.message || 'Please check your credentials and try again',
      });
      // setLoading(false);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

export const useSignUp = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { login, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: (data: SignUpRequest) => authApi.signUp(data),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (response) => {
      if (response?.data?.user && response?.data?.token) {
        // Store in Zustand store
        login(response.data.user, response.data.token);
        
        toast.success('Registration successful!', {
          description: 'Your account has been created and you are now logged in',
        });
        
        // Redirect to dashboard
        router.push('/dashboard');
        
        // Invalidate all queries to refresh with authenticated state
        queryClient.invalidateQueries();
      }
    },
    onError: (error: any) => {
      console.error('Sign up error:', error);
      toast.error('Registration failed', {
        description: error?.message || 'Please check your information and try again',
      });
      setLoading(false);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
};

export const useSignOut = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout, token } = useAuthStore();

  return useMutation({
    mutationFn: async () => {
      // Use authenticated client for sign out
      if (token) {
        const client = getAuthenticatedClient(token);
        await client.post('/auth/signout');
      }
    },
    onSuccess: () => {
      // Clear Zustand store
      logout();
      
      toast.success('Logged out successfully', {
        description: 'You have been logged out',
      });
      
      // Clear all cached data
      queryClient.clear();
      
      // Redirect to sign in
      router.push('/auth/signin');
    },
    onError: (error: any) => {
      // Even if API call fails, clear local state
      logout();
      queryClient.clear();
      
      toast.error('Logout failed', {
        description: error?.message || 'You have been logged out locally',
      });
      
      router.push('/auth/signin');
    },
  });
};

// Hook to get authenticated API client
export const useAuthenticatedClient = () => {
  const { token } = useAuthStore();
  
  if (!token) {
    throw new Error('No authentication token available');
  }
  
  return getAuthenticatedClient(token);
}; 