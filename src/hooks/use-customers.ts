import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/lib/api/customers';
import { Customer } from '@/types';
import { toast } from 'sonner';

// Get customers with filters
export function useCustomers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  vehicleType?: string;
  organizationId?: number;
}) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => customersApi.getCustomers(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get single customer
export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: () => customersApi.getCustomer(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Create customer
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: customersApi.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer created successfully!');
    },
    onError: (error) => {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    },
  });
}

// Update customer
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      customersApi.updateCustomer(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', id] });
      toast.success('Customer updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    },
  });
}

// Delete customer
export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: customersApi.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully!');
    },
    onError: (error) => {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    },
  });
}

// Bulk update customers
export function useBulkUpdateCustomers() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ids, updates }: { ids: string[]; updates: Partial<Customer> }) =>
      customersApi.bulkUpdateCustomers(ids, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customers updated successfully!');
    },
    onError: (error) => {
      console.error('Error bulk updating customers:', error);
      toast.error('Failed to update customers');
    },
  });
}

// Get customer statistics
export function useCustomerStats(customerId: string) {
  return useQuery({
    queryKey: ['customers', customerId, 'stats'],
    queryFn: () => customersApi.getCustomerStats(customerId),
    enabled: !!customerId,
    staleTime: 5 * 60 * 1000,
  });
}

// Convert lead to customer
export function useConvertLeadToCustomer() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: customersApi.convertLeadToCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead converted to customer successfully!');
    },
    onError: (error) => {
      console.error('Error converting lead to customer:', error);
      toast.error('Failed to convert lead to customer');
    },
  });
}
