# TanStack Query Integration Guide

This document explains how TanStack Query (React Query) has been integrated into the Scrap Collection Service Admin Dashboard for efficient data fetching, caching, and synchronization.

## 🚀 Overview

TanStack Query provides powerful data synchronization capabilities including:
- **Automatic caching** with configurable stale times
- **Background refetching** to keep data fresh
- **Optimistic updates** for better user experience
- **Error handling** and retry logic
- **Loading states** and skeleton UI components
- **Mutation state management** for create/update/delete operations

## 📁 Architecture

### API Layer (`src/lib/api/`)
- **`client.ts`** - Axios instance with interceptors for auth and error handling
- **`leads.ts`** - Lead management API calls
- **`orders.ts`** - Order management API calls
- **`employees.ts`** - Employee management API calls
- **`collectors.ts`** - Collector management API calls
- **`scrap-yards.ts`** - Scrap yard management API calls
- **`payments.ts`** - Payment management API calls
- **`dashboard.ts`** - Dashboard analytics API calls

### Query Configuration (`src/lib/query-client.ts`)
- **Query Client** setup with optimized defaults
- **Query Keys Factory** for consistent cache key management
- **Stale time**: 5 minutes for most data
- **Cache time**: 10 minutes for garbage collection
- **Retry logic**: 2 retries with exponential backoff

### Custom Hooks (`src/hooks/`)
- **`use-dashboard.ts`** - Dashboard stats and analytics
- **`use-leads.ts`** - Lead CRUD operations
- **`use-orders.ts`** - Order management with assignment
- **`use-employees.ts`** - Employee management
- **`use-collectors.ts`** - Collector tracking and performance
- **`use-scrap-yards.ts`** - Scrap yard capacity management
- **`use-payments.ts`** - Payment processing and transactions

## 🔧 Usage Examples

### Basic Query Hook
```typescript
// Fetch leads with search and pagination
const { data, isLoading, error } = useLeads({
  page: 1,
  limit: 10,
  search: 'john',
  status: 'new'
});
```

### Mutation Hook with Optimistic Updates
```typescript
const createLeadMutation = useCreateLead();

const handleSubmit = async (leadData) => {
  try {
    await createLeadMutation.mutateAsync(leadData);
    // Success - cache automatically updated
  } catch (error) {
    // Error handling
    console.error('Failed to create lead:', error);
  }
};
```

### Optimistic Updates (Location Updates)
```typescript
const updateLocationMutation = useUpdateCollectorLocation();

// Location updates show immediately, rollback on error
const updateLocation = (id, location) => {
  updateLocationMutation.mutate({ id, location });
};
```

## 📊 Query Key Structure

Organized query keys for efficient cache invalidation:

```typescript
queryKeys = {
  leads: {
    all: ['leads'],
    lists: () => ['leads', 'list'],
    list: (filters) => ['leads', 'list', filters],
    detail: (id) => ['leads', 'detail', id]
  },
  // Similar structure for other entities...
}
```

## 🔄 Cache Invalidation Strategy

### Automatic Invalidation
- **Create operations** → Invalidate list queries
- **Update operations** → Update specific item + invalidate lists
- **Delete operations** → Remove from cache + invalidate lists
- **Status changes** → Invalidate related dashboards and stats

### Cross-Entity Updates
- **Lead conversion** → Updates both leads and orders caches
- **Collector assignment** → Updates orders, collectors, and dashboard
- **Payment status** → Updates payments, orders, and revenue stats

## 🎨 UI Integration

### Loading States
```typescript
{isLoading ? (
  <Skeleton className="h-4 w-32" />
) : (
  <span>{data.name}</span>
)}
```

### Error Handling
```typescript
if (error) {
  return (
    <div className="text-center py-12">
      <p className="text-red-600">Error loading data</p>
      <Button onClick={() => refetch()}>Retry</Button>
    </div>
  );
}
```

### Mutation States
```typescript
<Button 
  disabled={createMutation.isPending}
  onClick={handleCreate}
>
  {createMutation.isPending ? (
    <Loader2 className="animate-spin" />
  ) : (
    <Plus />
  )}
  Create Lead
</Button>
```

## ⚡ Performance Optimizations

### Stale Time Configuration
- **Dashboard stats**: 2 minutes (frequent updates needed)
- **Real-time data** (collector locations): 1 minute
- **Reference data** (scrap yards): 5 minutes
- **Historical data**: 10 minutes

### Prefetching
```typescript
// Prefetch related data on hover
const onMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => ordersApi.getOrder(orderId)
  });
};
```

### Background Refetching
- **Window focus**: Disabled (reduces API calls)
- **Reconnect**: Enabled (ensures data freshness)
- **Interval refetching**: Configured per query type

## 🛠️ Development Tools

### React Query Devtools
- Enabled in development environment
- Shows query states, cache contents, and network requests
- Access via bottom-right panel

### Environment Configuration
```bash
# Enable devtools
NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=true

# API endpoint
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🔐 Error Handling

### API Client Interceptors
- **401 Errors**: Automatic token refresh or redirect to login
- **Network Errors**: Exponential backoff retry
- **Validation Errors**: Extract and display user-friendly messages

### Mutation Error Handling
```typescript
const mutation = useMutation({
  mutationFn: api.createLead,
  onError: (error) => {
    toast.error(error.message || 'Operation failed');
  },
  onSuccess: (data) => {
    toast.success('Lead created successfully');
  }
});
```

## 📱 Real-time Features

### Polling for Critical Data
```typescript
// Auto-refresh collector locations every 30 seconds
const { data } = useCollectors({}, {
  refetchInterval: 30000, // 30 seconds
  refetchIntervalInBackground: true
});
```

### WebSocket Integration (Future)
- Real-time order status updates
- Live collector location tracking
- Instant notification delivery

## 🧪 Testing Integration

### Mock Query Client
```typescript
// Test setup with React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);
```

## 📈 Monitoring & Analytics

### Performance Metrics
- Query success/failure rates
- Average response times
- Cache hit ratios
- Background refetch frequency

### Error Tracking
- Failed mutations with context
- Network timeouts and retries
- Invalid cache states

## 🚦 Best Practices

1. **Query Key Consistency** - Use the centralized query keys factory
2. **Optimistic Updates** - For immediate UI feedback
3. **Error Boundaries** - Wrap components for graceful error handling
4. **Skeleton Loading** - Maintain layout during loading states
5. **Cache Invalidation** - Strategic invalidation for data consistency
6. **Memory Management** - Appropriate garbage collection times
7. **Background Updates** - Keep data fresh without user interaction

## 🔄 Migration from Mock Data

The integration replaces static mock data with dynamic API calls:

### Before (Mock Data)
```typescript
const [leads, setLeads] = useState(mockLeads);
```

### After (TanStack Query)
```typescript
const { data: leads, isLoading, error } = useLeads();
```

## 📋 API Endpoints Expected

The frontend expects the following backend API structure:

### Base URL
- Development: `http://localhost:3001/api`
- Production: `https://api.scrap-collection.com`

### Authentication
- Bearer token in Authorization header
- Automatic token refresh on 401 responses

### Endpoints
- `GET /leads` - List leads with pagination and filters
- `POST /leads` - Create new lead
- `PUT /leads/:id` - Update lead
- `DELETE /leads/:id` - Delete lead
- Similar patterns for orders, employees, collectors, payments, etc.

### Response Format
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

This integration provides a robust foundation for real-time data management while maintaining excellent user experience through optimistic updates and intelligent caching strategies.