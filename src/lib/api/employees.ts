import { apiClient } from './client';
import { Employee, EmployeeRole } from '@/types';

export const employeesApi = {
  // Get all employees with optional filters
  getEmployees: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: EmployeeRole;
    isActive?: boolean;
    organizationId?: number;
    workZone?: string;
  }): Promise<{ data: { employees: Employee[], pagination: any } }> => {
    const response = await apiClient.get('/employees', { params });
    return response.data;
  },

  // Get single employee by ID
  getEmployee: async (id: string): Promise<{ data: Employee }> => {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data;
  },

  // Create new employee
  createEmployee: async (employeeData: {
    organizationId: number;
    fullName: string;
    email: string;
    phone: string;
    role: EmployeeRole;
    workZone?: string;
    password: string;
    profilePhoto?: string;
    scrapYardId?: string;
  }): Promise<{ data: Employee }> => {
    const response = await apiClient.post('/employees', employeeData);
    return response.data;
  },

  // Update existing employee
  updateEmployee: async (id: string, employeeData: Partial<Employee & { password?: string }>): Promise<{ data: Employee }> => {
    const response = await apiClient.put(`/employees/${id}`, employeeData);
    return response.data;
  },

  // Delete employee
  deleteEmployee: async (id: string): Promise<void> => {
    await apiClient.delete(`/employees/${id}`);
  },

  // Activate employee
  activateEmployee: async (id: string): Promise<{ data: Employee }> => {
    const response = await apiClient.put(`/employees/${id}/activate`);
    return response.data;
  },

  // Deactivate employee
  deactivateEmployee: async (id: string): Promise<{ data: Employee }> => {
    const response = await apiClient.put(`/employees/${id}/deactivate`);
    return response.data;
  },

  // Get employee performance
  getEmployeePerformance: async (id: string): Promise<{ data: any }> => {
    const response = await apiClient.get(`/employees/${id}/performance`);
    return response.data;
  },
};
