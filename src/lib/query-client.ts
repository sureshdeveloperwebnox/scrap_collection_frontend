import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data will be considered stale after 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache will be garbage collected after 10 minutes of inactivity
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Retry delay that increases exponentially
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mutations once
      retry: 1,
      // Show error notifications for failed mutations
      onError: (error: any) => {
        console.error('Mutation error:', error);
        // You can integrate with a toast notification system here
      },
    },
  },
});

// Query keys factory for consistent key management
export const queryKeys = {
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: (period?: string) => [...queryKeys.dashboard.all, 'stats', period] as const,
    recentActivity: (limit?: number) => [...queryKeys.dashboard.all, 'recent-activity', limit] as const,
    performance: (period?: string) => [...queryKeys.dashboard.all, 'performance', period] as const,
    analytics: (type: string, period?: string) => [...queryKeys.dashboard.all, 'analytics', type, period] as const,
    topCollectors: (limit?: number) => [...queryKeys.dashboard.all, 'top-collectors', limit] as const,
    alerts: () => [...queryKeys.dashboard.all, 'alerts'] as const,
  },

  // Leads
  leads: {
    all: ['leads'] as const,
    lists: () => [...queryKeys.leads.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.leads.lists(), filters] as const,
    details: () => [...queryKeys.leads.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.leads.details(), id] as const,
    stats: (organizationId?: number) => [...queryKeys.leads.all, 'stats', organizationId] as const,
  },

  // Vehicle Types
  vehicleTypes: {
    all: ['vehicle-types'] as const,
    lists: () => [...queryKeys.vehicleTypes.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.vehicleTypes.lists(), filters] as const,
    details: () => [...queryKeys.vehicleTypes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.vehicleTypes.details(), id] as const,
    stats: (organizationId?: number) => [...queryKeys.vehicleTypes.all, 'stats', organizationId] as const,
  },

  // Orders
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    stats: (period?: string) => [...queryKeys.orders.all, 'stats', period] as const,
    byCollector: (collectorId: string) => [...queryKeys.orders.all, 'by-collector', collectorId] as const,
  },

  // Employees
  employees: {
    all: ['employees'] as const,
    lists: () => [...queryKeys.employees.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.employees.lists(), filters] as const,
    details: () => [...queryKeys.employees.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.employees.details(), id] as const,
    stats: () => [...queryKeys.employees.all, 'stats'] as const,
    byRole: (role: string) => [...queryKeys.employees.all, 'by-role', role] as const,
  },

  // Collectors
  collectors: {
    all: ['collectors'] as const,
    lists: () => [...queryKeys.collectors.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.collectors.lists(), filters] as const,
    details: () => [...queryKeys.collectors.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.collectors.details(), id] as const,
    stats: () => [...queryKeys.collectors.all, 'stats'] as const,
    performance: (id: string, period?: string) => [...queryKeys.collectors.all, 'performance', id, period] as const,
    available: (location: { lat: number; lng: number }, radius?: number) => 
      [...queryKeys.collectors.all, 'available', location, radius] as const,
    reviews: (id: string, page?: number) => [...queryKeys.collectors.all, 'reviews', id, page] as const,
  },

  // Scrap Yards
  scrapYards: {
    all: ['scrap-yards'] as const,
    lists: () => [...queryKeys.scrapYards.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.scrapYards.lists(), filters] as const,
    details: () => [...queryKeys.scrapYards.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.scrapYards.details(), id] as const,
    stats: () => [...queryKeys.scrapYards.all, 'stats'] as const,
    capacityStatus: () => [...queryKeys.scrapYards.all, 'capacity-status'] as const,
    byRegion: (region: string) => [...queryKeys.scrapYards.all, 'by-region', region] as const,
    nearest: (location: { lat: number; lng: number }) => 
      [...queryKeys.scrapYards.all, 'nearest', location] as const,
  },

  // Payments
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.payments.lists(), filters] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
    stats: (period?: string) => [...queryKeys.payments.all, 'stats', period] as const,
    byCustomer: (customerId: string) => [...queryKeys.payments.all, 'by-customer', customerId] as const,
    byOrder: (orderId: string) => [...queryKeys.payments.all, 'by-order', orderId] as const,
  },

  // Cities
  cities: {
    all: ['cities'] as const,
    lists: () => [...queryKeys.cities.all, 'list'] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.cities.lists(), filters] as const,
    details: () => [...queryKeys.cities.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.cities.details(), id] as const,
  },
} as const;