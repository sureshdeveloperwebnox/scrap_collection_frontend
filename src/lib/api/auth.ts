import { apiClient } from './client';

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
}

export const authApi = {
  signIn: async (data: SignInRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/signin', data);
    return response.data;
  },

  signUp: async (data: SignUpRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/signup', data);
    return response.data;
  },

  signOut: async (): Promise<void> => {
    await apiClient.post('/auth/signout');
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  },
}; 