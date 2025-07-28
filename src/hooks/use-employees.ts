import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { Employee } from '@/types';

// Get all employees with optional filters
export const useEmployees = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  workZone?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.employees.list(params),
    queryFn: () => employeesApi.getEmployees(params),
    keepPreviousData: true,
  });
};

// Get single employee
export const useEmployee = (id: string) => {
  return useQuery({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => employeesApi.getEmployee(id),
    enabled: !!id,
  });
};

// Get employee statistics
export const useEmployeeStats = () => {
  return useQuery({
    queryKey: queryKeys.employees.stats(),
    queryFn: () => employeesApi.getEmployeeStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Get employees by role
export const useEmployeesByRole = (role: string) => {
  return useQuery({
    queryKey: queryKeys.employees.byRole(role),
    queryFn: () => employeesApi.getEmployeesByRole(role),
    enabled: !!role,
  });
};

// Create employee mutation
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => 
      employeesApi.createEmployee(employeeData),
    onSuccess: (newEmployee) => {
      // Invalidate employees list
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      
      // Add new employee to cache
      queryClient.setQueryData(queryKeys.employees.detail(newEmployee.id), newEmployee);
      
      // Update stats
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.stats() });
      
      // Update role-specific lists
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.employees.byRole(newEmployee.role) 
      });
      
      // Update dashboard if collector
      if (newEmployee.role === 'collector') {
        queryClient.invalidateQueries({ queryKey: queryKeys.collectors.stats() });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
      }
    },
  });
};

// Update employee mutation
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) => 
      employeesApi.updateEmployee(id, data),
    onSuccess: (updatedEmployee) => {
      // Update employee in cache
      queryClient.setQueryData(queryKeys.employees.detail(updatedEmployee.id), updatedEmployee);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.stats() });
      
      // Update role-specific lists
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.employees.byRole(updatedEmployee.role) 
      });
      
      // Update collector data if role is collector
      if (updatedEmployee.role === 'collector') {
        queryClient.invalidateQueries({ queryKey: queryKeys.collectors.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.collectors.stats() });
      }
    },
  });
};

// Delete employee mutation
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeesApi.deleteEmployee(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.employees.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.stats() });
      
      // Update collector stats if applicable
      queryClient.invalidateQueries({ queryKey: queryKeys.collectors.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
    },
  });
};

// Toggle employee status mutation
export const useToggleEmployeeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeesApi.toggleEmployeeStatus(id),
    onSuccess: (updatedEmployee) => {
      // Update employee in cache
      queryClient.setQueryData(queryKeys.employees.detail(updatedEmployee.id), updatedEmployee);
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.stats() });
      
      // Update collector data if role is collector
      if (updatedEmployee.role === 'collector') {
        queryClient.invalidateQueries({ queryKey: queryKeys.collectors.lists() });
        queryClient.invalidateQueries({ queryKey: queryKeys.collectors.stats() });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() });
      }
    },
  });
};