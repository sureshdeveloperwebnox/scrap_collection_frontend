import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '@/lib/api';
import { queryKeys } from '@/lib/query-client';
import { Employee } from '@/types';
import { useAuthStore } from '@/lib/store/auth-store';

// Get all employees with optional filters
export const useEmployees = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: number;
  role?: string;
  isActive?: boolean;
  workZone?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.employees.list(params),
    queryFn: () => employeesApi.getEmployees(params),
    placeholderData: (previousData: any) => previousData,
    staleTime: 30 * 1000, // 30 seconds - shorter for responsive updates
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false, // We invalidate explicitly when forms open
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
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  return useQuery({
    queryKey: queryKeys.employees.stats(organizationId),
    queryFn: async () => {
      const response = await employeesApi.getEmployeeStats(organizationId || 0);
      return response.data;
    },
    enabled: !!organizationId,
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
    mutationFn: (employeeData: any) =>
      employeesApi.createEmployee(employeeData),
    onSuccess: (response) => {
      const newEmployee = response.data;
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
    },
  });
};

// Update employee mutation
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee & { password?: string; roleId?: number; cityId?: number | null }> }) =>
      employeesApi.updateEmployee(id, data),
    onSuccess: (response) => {
      const updatedEmployee = response.data;
      // Update employee in cache
      queryClient.setQueryData(queryKeys.employees.detail(updatedEmployee.id), updatedEmployee);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.stats() });

      // Update role-specific lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.employees.byRole(updatedEmployee.role)
      });
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
    },
  });
};

// Toggle employee status mutation
export const useToggleEmployeeStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeesApi.toggleEmployeeStatus(id),
    onSuccess: (response) => {
      const updatedEmployee = response.data;
      // Update employee in cache
      queryClient.setQueryData(queryKeys.employees.detail(updatedEmployee.id), updatedEmployee);

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.stats() });

      // Update role-specific lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.employees.byRole(updatedEmployee.role)
      });
    },
  });
};