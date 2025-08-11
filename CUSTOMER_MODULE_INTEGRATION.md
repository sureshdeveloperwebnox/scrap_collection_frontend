# Customer Module Integration

This document outlines the customer module that has been added to the scrap collection frontend, following the same pattern as the existing lead module.

## Overview

The customer module provides comprehensive customer management functionality including:
- Customer listing with filtering and sorting
- Customer creation and editing
- Status management (Active, Inactive, VIP, Blocked)
- Customer statistics tracking
- Integration with vehicle types and scrap categories

## Features

### 1. Customer Management
- **CRUD Operations**: Create, Read, Update, Delete customers
- **Status Management**: Track customer status (Active, Inactive, VIP, Blocked)
- **Contact Information**: Name, phone, email, address
- **Vehicle Preferences**: Associated vehicle types and scrap categories

### 2. Customer Analytics
- **Order Tracking**: Total orders and total spent
- **Last Order Date**: Track customer engagement
- **Performance Metrics**: Sort by orders, spending, creation date

### 3. Advanced Filtering
- **Status-based Tabs**: Quick filtering by customer status
- **Search Functionality**: Search by name, contact, email, or vehicle
- **Scrap Category Filter**: Filter by scrap category preferences
- **Sorting Options**: Sort by name, status, orders, spending, or creation date

## File Structure

```
src/
├── app/(dashboard)/customers/
│   └── page.tsx                 # Main customers page
├── components/
│   └── customer-form.tsx        # Customer form component
├── hooks/
│   └── use-customers.ts         # Customer API hooks
├── lib/api/
│   └── customers.ts             # Customer API endpoints
└── types/
    └── index.ts                 # Customer type definitions
```

## API Integration

### Endpoints
- `GET /customers` - List customers with filters
- `GET /customers/:id` - Get customer details
- `POST /customers` - Create new customer
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer
- `PATCH /customers/bulk` - Bulk update customers
- `GET /customers/:id/stats` - Get customer statistics
- `POST /leads/:id/convert-to-customer` - Convert lead to customer

### Data Structure
```typescript
interface Customer {
  id: string;
  organizationId: number;
  name: string;
  contact: string;
  email: string;
  address: string;
  vehicleTypeId: number;
  scrapCategory: ScrapCategory;
  status: CustomerStatus;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'VIP' | 'BLOCKED';
```

## Usage Examples

### Creating a Customer
```typescript
import { useCreateCustomer } from '@/hooks/use-customers';

const createCustomerMutation = useCreateCustomer();

const handleCreate = async (customerData) => {
  await createCustomerMutation.mutateAsync({
    name: 'John Doe',
    contact: '+1234567890',
    email: 'john@example.com',
    address: '123 Main St',
    vehicleTypeId: 1,
    scrapCategory: 'JUNK',
    status: 'ACTIVE'
  });
};
```

### Fetching Customers
```typescript
import { useCustomers } from '@/hooks/use-customers';

const { data: customersData, isLoading, error } = useCustomers({
  search: 'John',
  status: 'ACTIVE',
  limit: 50
});
```

## UI Components

### CustomerForm
- Modal-based form for creating/editing customers
- Form validation and error handling
- Integration with vehicle types dropdown
- Status selection with visual indicators

### CustomerPage
- Responsive table and mobile card views
- Advanced filtering and sorting
- Status-based tab navigation
- Quick actions (view, edit, delete)

## Status Management

### Status Types
- **Active**: Regular customers with recent activity
- **Inactive**: Customers with no recent orders
- **VIP**: High-value customers with special treatment
- **Blocked**: Customers with restricted access

### Status Badges
- Color-coded status indicators
- Icons for quick visual recognition
- Inline status editing capability

## Integration Points

### Vehicle Types
- Customers are associated with preferred vehicle types
- Dropdown selection in customer forms
- Filtering by vehicle type in listings

### Scrap Categories
- Customers have preferred scrap categories
- Filtering and sorting by category
- Integration with existing scrap category system

### Orders System
- Customer order history tracking
- Total spent calculations
- Last order date monitoring

## Responsive Design

### Desktop View
- Full-featured table with all columns
- Advanced sorting and filtering
- Bulk operations support

### Mobile View
- Card-based layout for better mobile UX
- Touch-friendly action buttons
- Optimized for small screens

## Performance Features

### Data Caching
- React Query integration for efficient data management
- Optimistic updates for better UX
- Background data synchronization

### Lazy Loading
- Pagination support for large datasets
- Efficient filtering and sorting
- Minimal re-renders with React Query

## Error Handling

### API Errors
- Graceful error handling with user-friendly messages
- Toast notifications for success/error states
- Fallback UI for error conditions

### Validation
- Form validation with real-time feedback
- Required field enforcement
- Data type validation

## Future Enhancements

### Planned Features
- Customer analytics dashboard
- Customer segmentation tools
- Automated status updates
- Customer communication history
- Integration with external CRM systems

### API Extensions
- Customer activity tracking
- Customer preferences API
- Customer feedback system
- Loyalty program integration

## Testing

### Component Testing
- Form validation testing
- API integration testing
- Error handling testing
- Responsive design testing

### Integration Testing
- End-to-end customer workflows
- API endpoint testing
- Data consistency testing

## Deployment

### Build Requirements
- Ensure all dependencies are installed
- Verify API endpoint configurations
- Test in staging environment
- Monitor performance metrics

### Configuration
- API base URL configuration
- Environment-specific settings
- Feature flag management
- Error reporting setup

## Support

For questions or issues related to the customer module:
1. Check the API documentation
2. Review the component source code
3. Test with the provided examples
4. Contact the development team

---

This customer module follows the established patterns in the application and provides a solid foundation for customer management functionality.
