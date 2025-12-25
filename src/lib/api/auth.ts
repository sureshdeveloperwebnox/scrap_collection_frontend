import { apiClient } from './client';

export interface SignInRequest {
  email: string;
  password: string;
  role: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
  countryId?: number;
}

export interface AuthResponse {
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
}

export interface GoogleSignInRequest {
  idToken: string;
}

export const authApi = {
  signIn: async (data: SignInRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/signIn', data);
    return response.data;
  },

  signUp: async (data: SignUpRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/signUp', data);
    return response.data;
  },

  signOut: async (): Promise<void> => {
    await apiClient.post('/auth/signout');
  },

  refreshToken: async (): Promise<void> => {
    await apiClient.post('/auth/refresh');
  },

  signInWithGoogle: async (data: GoogleSignInRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/google', data);
    return response.data;
  },

  getMe: async (): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/me');
    return response.data;
  },

  updateProfile: async (data: any): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/profile', data);
    return response.data;
  },
};