import { apiClient } from './client';
import { Employee } from '@/types';

export const employeesApi = {
  // Get all employees with optional filters
  getEmployees: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    workZone?: string;
  }): Promise<{ data: Employee[], total: number, page: number, limit: number }> => {
    const response = await apiClient.get('/employees', { params });
    return response.data;
  },

  // Get single employee by ID
  getEmployee: async (id: string): Promise<Employee> => {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data;
  },

  // Create new employee
  createEmployee: async (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Employee> => {
    const response = await apiClient.post('/employees', employeeData);
    return response.data;
  },

  // Update existing employee
  updateEmployee: async (id: string, employeeData: Partial<Employee>): Promise<Employee> => {
    const response = await apiClient.put(`/employees/${id}`, employeeData);
    return response.data;
  },

  // Delete employee
  deleteEmployee: async (id: string): Promise<void> => {
    await apiClient.delete(`/employees/${id}`);
  },

  // Toggle employee status
  toggleEmployeeStatus: async (id: string): Promise<Employee> => {
    const response = await apiClient.patch(`/employees/${id}/toggle-status`);
    return response.data;
  },

  // Get employees by role
  getEmployeesByRole: async (role: string): Promise<Employee[]> => {
    const response = await apiClient.get('/employees', { params: { role } });
    return response.data.data;
  },

  // Get employee statistics
  getEmployeeStats: async (): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
    byWorkZone: Record<string, number>;
  }> => {
    const response = await apiClient.get('/employees/stats');
    return response.data;
  },
};