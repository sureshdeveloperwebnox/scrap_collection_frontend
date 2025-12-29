import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/lib/api/invoices';

export const useInvoices = (params?: any) => {
    return useQuery({
        queryKey: ['invoices', params],
        queryFn: () => invoicesApi.getInvoices(params),
    });
};

export const useInvoiceStats = () => {
    return useQuery({
        queryKey: ['invoices', 'stats'],
        queryFn: () => invoicesApi.getInvoiceStats(),
    });
};

export const useCreateInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => invoicesApi.createInvoice(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
    });
};

export const useUpdateInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => invoicesApi.updateInvoice(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
    });
};

export const useDeleteInvoice = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => invoicesApi.deleteInvoice(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
    });
};

export const useUpdateInvoiceStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            invoicesApi.updateInvoiceStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
    });
};
