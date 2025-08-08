# Lead Form API Integration

## Overview
The lead form module has been successfully converted from local state management to API-based functionality using React Query for efficient data fetching and caching.

## Changes Made

### 1. LeadForm Component (`src/components/lead-form.tsx`)

**Key Changes:**
- **API Integration**: Now uses `useCreateLead` and `useUpdateLead` hooks from `@/hooks/use-leads`
- **Loading States**: Added loading indicators and disabled form fields during API calls
- **Error Handling**: Integrated toast notifications for success/error feedback
- **Form Reset**: Proper form initialization and reset logic using `useEffect`
- **Backward Compatibility**: Made `onSubmit` prop optional for existing usage

**New Features:**
- Loading spinners in submit buttons
- Disabled form fields during API operations
- Success/error toast notifications
- Automatic form reset when dialog opens/closes

### 2. Leads Page (`src/app/(dashboard)/leads/page.tsx`)

**Key Changes:**
- **API Data Fetching**: Replaced mock data with `useLeads` hook
- **Search Functionality**: Integrated server-side search via API parameters
- **Delete Operations**: Added `useDeleteLead` hook for API-based deletion
- **Loading States**: Added loading indicators and empty states
- **Error Handling**: Proper error boundaries and user feedback

**New Features:**
- Real-time search with API integration
- Loading states for data fetching
- Empty state handling
- Error state display
- Optimistic updates via React Query

## API Endpoints Used

The lead form now integrates with the following API endpoints:

- `GET /api/v1/leads` - Fetch leads with optional filters
- `POST /api/v1/leads` - Create new lead
- `PUT /api/v1/leads/:id` - Update existing lead
- `DELETE /api/v1/leads/:id` - Delete lead

## React Query Integration

**Query Keys:**
- `queryKeys.leads.list(filters)` - For fetching leads list
- `queryKeys.leads.detail(id)` - For individual lead details

**Mutations:**
- `useCreateLead()` - Creates new leads
- `useUpdateLead()` - Updates existing leads
- `useDeleteLead()` - Deletes leads

**Cache Management:**
- Automatic cache invalidation on mutations
- Optimistic updates for better UX
- Background refetching for data consistency

## Benefits

1. **Real-time Data**: All operations now sync with the backend
2. **Better UX**: Loading states and error handling
3. **Performance**: React Query caching and background updates
4. **Scalability**: Server-side search and pagination support
5. **Reliability**: Proper error boundaries and retry logic

## Usage

The LeadForm component can now be used without the `onSubmit` prop since it handles API operations internally:

```tsx
<LeadForm
  lead={editingLead}
  isOpen={isFormOpen}
  onClose={() => setIsFormOpen(false)}
  // onSubmit prop is now optional
/>
```

## Dependencies

- `@tanstack/react-query` - For API state management
- `sonner` - For toast notifications
- `axios` - For HTTP requests

## Environment Variables

Ensure the following environment variable is set:
- `NEXT_PUBLIC_API_URL` - Backend API base URL (defaults to `http://localhost:9645/api/v1`) 