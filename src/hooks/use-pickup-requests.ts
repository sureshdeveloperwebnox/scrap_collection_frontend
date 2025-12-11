import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pickupRequestsApi } from '@/lib/api';
import { PickupRequest } from '@/types';

// Get all pickup requests with optional filters
export const usePickupRequests = (params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  assignedTo?: string;
  customerId?: string;
  organizationId?: number;
}) => {
  return useQuery({
    queryKey: ['pickup-requests', params],
    queryFn: () => pickupRequestsApi.getPickupRequests(params),
    placeholderData: (previousData) => previousData,
  });
};

// Get single pickup request
export const usePickupRequest = (id: string) => {
  return useQuery({
    queryKey: ['pickup-requests', id],
    queryFn: () => pickupRequestsApi.getPickupRequest(id),
    enabled: !!id,
  });
};

// Create pickup request mutation
export const useCreatePickupRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestData: {
      customerId: string;
      vehicleDetails: any;
      pickupAddress: string;
      latitude?: number;
      longitude?: number;
      organizationId: number;
    }) => pickupRequestsApi.createPickupRequest(requestData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickup-requests'] });
    },
  });
};

// Update pickup request mutation
export const useUpdatePickupRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PickupRequest> }) => 
      pickupRequestsApi.updatePickupRequest(id, data),
    onSuccess: (updatedRequest) => {
      queryClient.setQueryData(['pickup-requests', updatedRequest.id], updatedRequest);
      queryClient.invalidateQueries({ queryKey: ['pickup-requests'] });
    },
  });
};

// Delete pickup request mutation
export const useDeletePickupRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pickupRequestsApi.deletePickupRequest(id),
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: ['pickup-requests', deletedId] });
      queryClient.invalidateQueries({ queryKey: ['pickup-requests'] });
    },
  });
};

// Assign pickup request mutation
export const useAssignPickupRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, collectorId }: { requestId: string; collectorId: string }) => 
      pickupRequestsApi.assignPickupRequest(requestId, collectorId),
    onSuccess: (updatedRequest) => {
      queryClient.setQueryData(['pickup-requests', updatedRequest.id], updatedRequest);
      queryClient.invalidateQueries({ queryKey: ['pickup-requests'] });
    },
  });
};
