import { apiClient } from './client';

export interface UploadConfig {
  maxFileSize: number;
  maxFileSizeMB: number;
  allowedTypes: string[];
  maxFiles: number;
}

export interface UploadResponse {
  paths: string[]; // Relative paths (not full URLs)
  count: number;
  errors?: string[];
}

export const imageUploadApi = {
  // Upload images
  uploadImages: async (files: File[], uploadType: string = 'lead/vehicles/images'): Promise<{ data: UploadResponse }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await apiClient.post(`/upload/images?type=${uploadType}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete a single image
  deleteImage: async (imagePath: string): Promise<{ data: null }> => {
    const response = await apiClient.delete('/upload/images', {
      data: { path: imagePath },
    });
    return response.data;
  },

  // Delete multiple images
  deleteImages: async (imagePaths: string[]): Promise<{ data: { deleted: string[]; failed: string[] } }> => {
    const response = await apiClient.delete('/upload/images/bulk', {
      data: { paths: imagePaths },
    });
    return response.data;
  },

  // Get upload configuration
  getUploadConfig: async (): Promise<{ data: UploadConfig }> => {
    const response = await apiClient.get('/upload/config');
    return response.data;
  },
};
