import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, SignInRequest, SignUpRequest } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';

export const useSignIn = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SignInRequest) => authApi.signIn(data),
    onSuccess: (response) => {
      console.log("response", response  );
      // Store token in localStorage or cookie
      localStorage.setItem('token', response?.data?.token);
      localStorage.setItem('user', JSON.stringify(response?.data?.user));
      
      // Redirect to dashboard
      router.push('/dashboard');
      
      // Invalidate all queries to refresh with authenticated state
      queryClient.invalidateQueries();
    },
  });
};

export const useSignUp = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SignUpRequest) => authApi.signUp(data),
    onSuccess: (response) => {
      // Store token in localStorage or cookie
      localStorage.setItem('token', response?.data?.token);
      localStorage.setItem('user', JSON.stringify(response?.data?.user));
      
      // Redirect to dashboard
      router.push('/dashboard');
      
      // Invalidate all queries to refresh with authenticated state
      queryClient.invalidateQueries();
    },
  });
};

export const useSignOut = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.signOut(),
    onSuccess: () => {
      // Remove token and user data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear all cached data
      queryClient.clear();
      
      // Redirect to sign in
      router.push('/');
    },
  });
}; 