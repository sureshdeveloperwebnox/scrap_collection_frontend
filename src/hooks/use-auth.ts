import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CredentialResponse } from '@react-oauth/google';
import { authApi, SignInRequest, SignUpRequest, GoogleSignInRequest } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth-store';
import { getAuthenticatedClient } from '@/lib/api/client';
import { useEffect } from 'react';
import { toast } from 'sonner';

// Hook to initialize authentication state
export const useAuthInit = () => {
  const { token, user, isAuthenticated, setLoading, setHydrated, logout } = useAuthStore();
  const router = useRouter();

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
            // Token is invalid, clear auth state and redirect
            logout();
            router.push('/auth/signin');
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
  }, [token, user, isAuthenticated, setLoading, setHydrated, logout, router]);
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
        
        // Use Next.js router for navigation instead of page refresh
        router.push('/dashboard');
        
        // Invalidate all queries to refresh with authenticated state
        queryClient.invalidateQueries();
      } else {
        // Handle case where response doesn't have expected data
        toast.error('Login failed', {
          description: 'Invalid response from server',
        });
      }
    },
    onError: (error: any) => {
      console.error('Sign in error:', error);
      
      // Extract error message from different possible error structures
      let errorMessage = 'Please check your credentials and try again';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error?.response?.status === 400) {
        errorMessage = 'Invalid credentials provided';
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error. Please try again later';
      }
      
      toast.error('Login failed', {
        description: errorMessage,
      });
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
        
        // Use Next.js router for navigation instead of page refresh
        router.push('/dashboard');
        
        // Invalidate all queries to refresh with authenticated state
        queryClient.invalidateQueries();
      } else {
        // Handle case where response doesn't have expected data
        toast.error('Registration failed', {
          description: 'Invalid response from server',
        });
      }
    },
    onError: (error: any) => {
      console.error('Sign up error:', error);
      
      // Extract error message from different possible error structures
      let errorMessage = 'Please check your information and try again';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 400) {
        errorMessage = 'Invalid registration data provided';
      } else if (error?.response?.status === 409) {
        errorMessage = 'User already exists with this email';
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error. Please try again later';
      }
      
      toast.error('Registration failed', {
        description: errorMessage,
      });
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
      
      // Use Next.js router for navigation instead of page refresh
      router.push('/auth/signin');
    },
    onError: (error: any) => {
      // Even if API call fails, clear local state
      logout();
      queryClient.clear();
      
      toast.error('Logout failed', {
        description: error?.message || 'You have been logged out locally',
      });
      
      // Use Next.js router for navigation instead of page refresh
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

export const useGoogleSignIn = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { login, setLoading } = useAuthStore();

  const googleSignInMutation = useMutation({
    mutationFn: (data: GoogleSignInRequest) => authApi.signInWithGoogle(data),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: (response) => {
      console.log("Google sign in response:", response);
      
      if (response?.data?.user && response?.data?.token) {
        // Store in Zustand store
        login(response.data.user, response.data.token);

        toast.success('Google sign-in successful!', {
          description: 'You are now logged in',
        });
        
        // Use Next.js router for navigation instead of page refresh
        router.push('/dashboard');
        
        // Invalidate all queries to refresh with authenticated state
        queryClient.invalidateQueries();
      } else {
        // Handle case where response doesn't have expected data
        toast.error('Google sign-in failed', {
          description: 'Invalid response from server',
        });
      }
    },
    onError: (error: any) => {
      console.error('Google sign in error:', error);
      
      // Extract error message from different possible error structures
      let errorMessage = 'Google sign-in failed. Please try again';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 401) {
        errorMessage = 'Google authentication failed';
      } else if (error?.response?.status === 500) {
        errorMessage = 'Server error. Please try again later';
      }
      
      toast.error('Google sign-in failed', {
        description: errorMessage,
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  // Handle Google credential response (from GoogleLogin component)
  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    if (credentialResponse?.credential) {
      googleSignInMutation.mutate({ idToken: credentialResponse.credential });
    } else {
      toast.error('Google sign-in failed', {
        description: 'No credential received from Google',
      });
    }
  };

  return {
    handleGoogleSuccess,
    isLoading: googleSignInMutation.isPending,
    isError: googleSignInMutation.isError,
    error: googleSignInMutation.error,
  };
}; 