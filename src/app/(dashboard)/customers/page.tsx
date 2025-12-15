'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomerForm } from '@/components/customer-form';
import { Customer, CustomerStatus, VehicleTypeEnum, VehicleConditionEnum } from '@/types';
import { Plus, Search, Edit2, Trash2, Loader2, CheckCircle2, Clock, ChevronDown, ArrowUpDown, Eye, MoreHorizontal, Download, Filter, Check, X, Crown, Shield, UserX, Car } from 'lucide-react';
import { useCustomers, useDeleteCustomer, useUpdateCustomer } from '@/hooks/use-customers';
import { useCustomerStats } from '@/hooks/use-customer-stats';
import { useCustomerStatsStore } from '@/lib/store/customer-stats-store';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/lib/store/auth-store';
import { customersApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';

// Dynamically import Lottie for better performance
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// No Data Animation Component - Optimized with lazy loading
function NoDataAnimation() {
  const [animationData, setAnimationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load animation data only when component mounts (client-side only)
    fetch('/animation/nodatafoundanimation.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load animation');
        }
        return response.json();
      })
      .then((data) => {
        setAnimationData(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load animation:', error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    // Fallback while loading
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <div className="mt-2 text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!animationData) {
    // Fallback if animation fails to load
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-gray-400 text-sm">No customers found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <p className="mt-4 text-gray-600 text-sm font-medium">No customers found</p>
      <p className="mt-1 text-gray-400 text-xs">Try adjusting your filters or create a new customer</p>
    </div>
  );
}

// API response type - matches backend Customer model
interface ApiCustomer {
  id: string;
  organizationId: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  vehicleType?: VehicleTypeEnum;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleNumber?: string;
  vehicleYear?: number;
  vehicleCondition?: VehicleConditionEnum;
  accountStatus: CustomerStatus;
  joinedDate?: string;
  createdAt: string;
  updatedAt: string;
  organization?: {
    name: string;
  };
}

interface ApiResponse {
  version: string;
  validationErrors: any[];
  code: number;
  status: string;
  message: string;
  data: {
    customers: ApiCustomer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

type SortKey = 'name' | 'createdAt' | 'accountStatus';

function formatDateHuman(dateStr: string): string {
  // Use a consistent date parsing to avoid hydration issues
  const date = new Date(dateStr);
  
  // Only use relative dates on client side to avoid hydration mismatch
  if (typeof window !== 'undefined') {
  const today = new Date();
  const yday = new Date();
  yday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yday)) return 'Yesterday';
  }
  
  // Format: DD Mon, YYYY (e.g., "01 Dec, 2027")
  // Use UTC methods for consistency between server and client
  const day = date.getUTCDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${day} ${month}, ${year}`;
}

function toDisplayStatus(status: string): 'Active' | 'Inactive' | 'VIP' | 'Blocked' | string {
  const s = status?.toUpperCase();
  if (s === 'ACTIVE') return 'Active';
  if (s === 'INACTIVE') return 'Inactive';
  if (s === 'VIP') return 'VIP';
  if (s === 'BLOCKED') return 'Blocked';
  return status;
}

// Tab color styles
type TabKey = 'All' | 'Active' | 'Inactive' | 'VIP' | 'Blocked';
function getTabStyle(tab: TabKey) {
  switch (tab) {
    case 'All':
      return { activeText: 'text-cyan-700', activeBg: 'bg-cyan-50', underline: 'bg-cyan-500', count: 'bg-cyan-100 text-cyan-700' };
    case 'Active':
      return { activeText: 'text-green-700', activeBg: 'bg-green-50', underline: 'bg-green-600', count: 'bg-green-100 text-green-700' };
    case 'Inactive':
      return { activeText: 'text-gray-700', activeBg: 'bg-gray-50', underline: 'bg-gray-600', count: 'bg-gray-100 text-gray-700' };
    case 'VIP':
      return { activeText: 'text-yellow-700', activeBg: 'bg-yellow-50', underline: 'bg-yellow-600', count: 'bg-yellow-100 text-yellow-700' };
    case 'Blocked':
      return { activeText: 'text-red-700', activeBg: 'bg-red-50', underline: 'bg-red-600', count: 'bg-red-100 text-red-700' };
    default:
      return { activeText: 'text-primary', activeBg: 'bg-muted', underline: 'bg-primary', count: 'bg-muted text-foreground' };
  }
}

// Reusable Customer Avatar Component - Always shows first letter, no images
function CustomerAvatar({ 
  name, 
  imageUrl, 
  size = 'md',
  className = ''
}: { 
  name: string; 
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const firstLetter = (name || 'N').charAt(0).toUpperCase();
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg'
  };
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-300 ${className}`}>
      <span className="text-white font-semibold leading-none">
        {firstLetter}
      </span>
    </div>
  );
}

function StatusBadge({ status, showDropdownIcon = false }: { status: string; showDropdownIcon?: boolean }) {
  const display = toDisplayStatus(status);
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap';
  
  let badgeContent = null;
  
  if (display === 'Active') {
    badgeContent = (
      <span className={`${base} bg-green-100 text-green-800`}>
        <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">Active</span>
        {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
      </span>
    );
  } else if (display === 'VIP') {
    badgeContent = (
      <span className={`${base} bg-yellow-100 text-yellow-800`}>
        <Crown className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">VIP</span>
        {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
      </span>
    );
  } else if (display === 'Inactive') {
    badgeContent = (
      <span className={`${base} bg-gray-100 text-gray-800`}>
        <UserX className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">Inactive</span>
        {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
      </span>
    );
  } else if (display === 'Blocked') {
    badgeContent = (
      <span className={`${base} bg-red-100 text-red-800`}>
        <Shield className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">Blocked</span>
        {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
      </span>
    );
  } else {
    badgeContent = (
      <span className={`${base} bg-gray-100 text-gray-800`}>
        <span className="whitespace-nowrap">{display}</span>
        {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
      </span>
    );
  }
  
  return badgeContent;
}

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Inactive' | 'VIP' | 'Blocked'>('All');
  const [scrapFilter, setScrapFilter] = useState<string>('ALL');
  
  // Sorting state
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [detailsCustomer, setDetailsCustomer] = useState<ApiCustomer | null>(null);
  const [vehicleDetailsCustomer, setVehicleDetailsCustomer] = useState<ApiCustomer | null>(null);
  const [highlightedCustomerId, setHighlightedCustomerId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<ApiCustomer | null>(null);
  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Selection state
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle highlight parameter from URL
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      setHighlightedCustomerId(highlightId);
      // Remove highlight parameter from URL after a delay
      setTimeout(() => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('highlight');
        const newUrl = newSearchParams.toString() 
          ? `${window.location.pathname}?${newSearchParams.toString()}`
          : window.location.pathname;
        router.replace(newUrl);
        // Remove highlight after animation completes
        setTimeout(() => setHighlightedCustomerId(null), 3000);
      }, 100);
    }
  }, [searchParams, router]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Map tab to status for API
  const getStatusFromTab = (tab: string): string | undefined => {
    const statusMap: Record<string, string> = {
      'Active': 'ACTIVE',
      'Inactive': 'INACTIVE',
      'VIP': 'VIP',
      'Blocked': 'BLOCKED'
    };
    return tab === 'All' ? undefined : statusMap[tab];
  };

  // Map sort key to API sortBy
  const getApiSortBy = (key: SortKey): 'name' | 'phone' | 'email' | 'status' | 'accountStatus' | 'createdAt' | 'updatedAt' => {
    const sortMap: Record<SortKey, 'name' | 'phone' | 'email' | 'status' | 'accountStatus' | 'createdAt' | 'updatedAt'> = {
      'name': 'name',
      'createdAt': 'createdAt',
      'accountStatus': 'accountStatus' as 'accountStatus'
    };
    return sortMap[key] || 'createdAt';
  };

  // Get available scrap categories - memoized for performance
  const scrapOptions = useMemo(() => ['ALL', 'JUNK', 'DAMAGED', 'WRECKED', 'ACCIDENTAL', 'FULLY_SCRAP'], []);
  
  // Memoize category filter value to prevent unnecessary re-renders
  const categoryFilterValue = useMemo(() => scrapFilter !== 'ALL' ? scrapFilter : undefined, [scrapFilter]);
  
  // Memoize query parameters for better performance
  const queryParams = useMemo(() => {
    const status = getStatusFromTab(activeTab);
    const sortBy = getApiSortBy(sortKey);
    return {
      page: currentPage,
      limit: rowsPerPage,
      search: debouncedSearchTerm || undefined,
      status: status as any,
      scrapCategory: categoryFilterValue,
      sortBy: sortBy as 'name' | 'phone' | 'email' | 'status' | 'accountStatus' | 'createdAt' | 'updatedAt',
      sortOrder: sortDir,
    };
  }, [currentPage, rowsPerPage, debouncedSearchTerm, activeTab, categoryFilterValue, sortKey, sortDir]);

  // API hooks with server-side pagination, filtering, and sorting - optimized with memoized params
  const { data: customersData, isLoading, error } = useCustomers(queryParams);
  const deleteCustomerMutation = useDeleteCustomer();
  const updateCustomerMutation = useUpdateCustomer();

  // Fetch and sync customer stats to Zustand store
  useCustomerStats();
  
  // Get stats from Zustand store - ensure we always have stats object
  const stats = useCustomerStatsStore((state) => state.stats) || {
    total: 0,
    active: 0,
    inactive: 0,
    vip: 0,
    blocked: 0,
  };

  // Handle the actual API response structure
  const apiResponse = customersData as unknown as ApiResponse;
  const customers = useMemo(() => apiResponse?.data?.customers || [], [apiResponse]);
  const pagination = useMemo(() => apiResponse?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  }, [apiResponse]);
  
  // Scroll to highlighted row when data is loaded (must be after customers declaration)
  useEffect(() => {
    if (highlightedCustomerId && highlightedRowRef.current && customers && customers.length > 0) {
      setTimeout(() => {
        highlightedRowRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
    }
  }, [highlightedCustomerId, customers]);

  const totalCustomers = pagination.total;

  // Map stats to tab counts
  const getTabCount = (tab: string): number => {
    switch (tab) {
      case 'All':
        return stats.total || 0;
      case 'Active':
        return stats.active || 0;
      case 'Inactive':
        return stats.inactive || 0;
      case 'VIP':
        return stats.vip || 0;
      case 'Blocked':
        return stats.blocked || 0;
      default:
        return 0;
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, scrapFilter, rowsPerPage]);

  // Prefetch next page for better UX - optimized with memoized params
  useEffect(() => {
    if (currentPage < pagination.totalPages && organizationId) {
      const nextPageParams = {
        ...queryParams,
        page: currentPage + 1,
        organizationId,
      };
      queryClient.prefetchQuery({
        queryKey: queryKeys.customers.list(nextPageParams),
        queryFn: () => customersApi.getCustomers(nextPageParams),
        staleTime: 3 * 60 * 1000,
      });
    }
  }, [currentPage, pagination.totalPages, queryClient, organizationId, queryParams]);

  const handleDeleteClick = (customer: ApiCustomer) => {
    setCustomerToDelete(customer);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    
      try {
      await deleteCustomerMutation.mutateAsync(customerToDelete.id);
      toast.success(`Customer "${customerToDelete.name}" deleted successfully`);
      setDeleteConfirmOpen(false);
      setCustomerToDelete(null);
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast.error('Failed to delete customer');
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Handle checkbox selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(new Set(customers.map(customer => customer.id)));
    } else {
      setSelectedCustomers(new Set());
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    const newSelected = new Set(selectedCustomers);
    if (checked) {
      newSelected.add(customerId);
    } else {
      newSelected.delete(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const isAllSelected = customers.length > 0 && selectedCustomers.size === customers.length;
  const isIndeterminate = selectedCustomers.size > 0 && selectedCustomers.size < customers.length;

  // Handle export
  const handleExport = () => {
    if (selectedCustomers.size === 0) {
      toast.info('Please select customers to export');
      return;
    }
    toast.success(`Exporting ${selectedCustomers.size} customers...`);
    // TODO: Implement export functionality
  };

  const onInlineStatusChange = async (customer: ApiCustomer, value: string) => {
    try {
      // Validate status value
      const validStatuses = ['ACTIVE', 'INACTIVE', 'VIP', 'BLOCKED'];
      if (!validStatuses.includes(value.toUpperCase())) {
        toast.error(`Invalid status: ${value}`);
        return;
      }

      const normalizedStatus = value.toUpperCase() as CustomerStatus;
      
      // Don't update if status hasn't changed
      if (customer.accountStatus.toUpperCase() === normalizedStatus) {
        return;
      }

      await updateCustomerMutation.mutateAsync({ 
        id: String(customer.id), 
        data: { accountStatus: normalizedStatus } 
      });
      toast.success('Status updated successfully');
      
      // Zustand store will be updated automatically by the mutation hook
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Failed to update status';
      toast.error(errorMessage);
      console.error('Status update error:', e);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading customers</h2>
          <p className="text-gray-600 mt-2">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Customers List Card */}
      <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <CardHeader className="pb-4">
          {/* Header and Controls on Same Line */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Title on Left */}
            <CardTitle className="text-xl font-bold text-gray-900">Customers</CardTitle>

            {/* Action Buttons on Right */}
            <div className="flex items-center gap-2">
              {/* Search Toggle Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-gray-900 active:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed h-9 w-9 p-0"
              >
                <Search className="h-4 w-4" />
              </Button>
              
              {/* Search Input - shown when isSearchOpen is true */}
              {isSearchOpen && (
                <div className="relative">
              <Input
                type="text"
                    placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={() => {
                      // Keep search open if there's a search term
                      if (!searchTerm) {
                        setIsSearchOpen(false);
                      }
                    }}
                    autoFocus
                    className="w-64 pl-10 pr-10 rounded-lg border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setIsSearchOpen(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
            </div>
              )}
              
              {/* Filter Icon Button - Toggle filter panel */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-gray-900 active:bg-gray-200 transition-all h-9 w-9 p-0 ${
                  scrapFilter !== 'ALL' ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : ''
                } ${
                  isFilterOpen ? 'border-cyan-500 bg-cyan-50' : ''
                }`}
                title={isFilterOpen ? "Hide filters" : "Show filters"}
              >
                <Filter className={`h-4 w-4 ${scrapFilter !== 'ALL' ? 'text-cyan-700' : ''}`} />
              </Button>
              
              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 w-9 p-0"
                title="Add Customer"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category Filter - Only shown when filter icon is clicked */}
          {isFilterOpen && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Category:</Label>
                  <Select 
                    value={scrapFilter} 
                    onValueChange={(v) => {
                      setScrapFilter(v);
                      setCurrentPage(1); // Reset to first page when filter changes
                    }}
                  >
                    <SelectTrigger className={`w-[200px] bg-white border-gray-200 hover:border-gray-300 transition-all ${
                      scrapFilter !== 'ALL' ? 'border-cyan-500 ring-2 ring-cyan-200' : ''
                    }`}>
                      <SelectValue placeholder="All Categories">
                        {scrapFilter === 'ALL' ? 'All Categories' : scrapFilter.replace(/_/g, ' ')}
                      </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                      {scrapOptions.filter(opt => opt !== 'ALL').map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt.replace(/_/g, ' ')}
                        </SelectItem>
                  ))}
                </SelectContent>
              </Select>
                  {scrapFilter !== 'ALL' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setScrapFilter('ALL');
                        setCurrentPage(1);
                      }}
                      className="h-8 px-2 text-gray-500 hover:text-gray-700"
                      title="Clear filter"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
            </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFilterOpen(false)}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                  title="Close filter panel"
                >
                  <X className="h-4 w-4" />
                </Button>
          </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {isLoading || !mounted ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading customers...</span>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="overflow-x-auto hidden sm:block">
                <Table>
                  <TableHeader className="bg-white">
                    {/* Status Tabs Row */}
                    <TableRow className="hover:bg-transparent border-b-2 border-gray-200 bg-gray-50">
                      <TableHead colSpan={8} className="p-0 bg-transparent">
                        <div className="w-full overflow-x-auto">
                          <div className="inline-flex items-center gap-1 px-2 py-2">
                            {(['All','Active','Inactive','VIP','Blocked'] as const).map((tab) => {
                              const style = getTabStyle(tab);
                              const isActive = activeTab === tab;
                              return (
                                <button
                                  key={tab}
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setActiveTab(tab);
                                    setCurrentPage(1); // Reset to first page when switching tabs
                                  }}
                                  className={`relative px-4 py-2 text-sm font-medium transition-all rounded-t-md ${isActive ? `${style.activeText} ${style.activeBg} shadow-sm` : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    {tab}
                                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${style.count}`}>
                                      {getTabCount(tab)}
                                    </span>
                                  </span>
                                  {isActive && <span className={`absolute left-0 right-0 -bottom-0.5 h-0.5 ${style.underline} rounded`} />}
                        </button>
                              );
                            })}
                          </div>
                        </div>
                      </TableHead>
                    </TableRow>
                    {/* Column Headers Row */}
                    <TableRow className="hover:bg-transparent border-b bg-white">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                        />
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-cyan-600 transition-colors" onClick={() => toggleSort('name')}>
                          Customer 
                        </button>
                      </TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-cyan-600 transition-colors" onClick={() => toggleSort('accountStatus')}>
                          Status 
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-cyan-600 transition-colors" onClick={() => toggleSort('createdAt')}>
                          Created Date 
                        </button>
                      </TableHead>
                      <TableHead className="w-12">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <NoDataAnimation />
                        </TableCell>
                      </TableRow>
                    ) : (
                      customers.map((customer) => {
                      const isHighlighted = highlightedCustomerId === customer.id;
                      return (
                        <TableRow 
                          key={customer.id}
                          ref={isHighlighted ? highlightedRowRef : null}
                          className={cn(
                            "border-b hover:bg-gray-50 transition-colors bg-white cursor-pointer",
                            isHighlighted && "bg-cyan-50 border-cyan-200 border-2 animate-pulse"
                          )}
                          onClick={() => setDetailsCustomer(customer)}
                            >
                        <TableCell>
                            <Checkbox
                              checked={selectedCustomers.has(customer.id)}
                              onCheckedChange={(checked) => handleSelectCustomer(customer.id, checked as boolean)}
                              onClick={(e) => e.stopPropagation()}
                              className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <CustomerAvatar 
                                name={customer.name || 'N/A'} 
                                size="md"
                              />
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{customer.name || 'N/A'}</span>
                              </div>
                          </div>
                        </TableCell>
                        <TableCell>
                            <div>
                              <div className="text-gray-900">{customer.phone || 'N/A'}</div>
                          </div>
                        </TableCell>
                          <TableCell className="text-gray-700">{customer.email || 'N/A'}</TableCell>
                        <TableCell>
                            {(customer.vehicleType || customer.vehicleMake || customer.vehicleModel || customer.vehicleNumber || customer.vehicleCondition) ? (
                            <Button 
                              variant="ghost" 
                              onClick={(e) => {
                                e.stopPropagation();
                                  setVehicleDetailsCustomer(customer);
                              }}
                                className="h-auto py-2 px-3 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 border border-cyan-200 hover:border-cyan-300 rounded-md transition-all"
                            >
                                <Car className="h-4 w-4 mr-2" />
                                <span className="text-sm font-medium">View Vehicle</span>
                            </Button>
                            ) : (
                              <div className="text-gray-400 text-sm italic">No vehicle info</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                              <Select value={customer.accountStatus} onValueChange={(v) => onInlineStatusChange(customer, v)}>
                                <SelectTrigger className="h-auto w-auto p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none max-w-none min-w-0 overflow-visible">
                                  <div className="flex items-center">
                                    <StatusBadge status={customer.accountStatus} showDropdownIcon={true} />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="min-w-[160px] rounded-lg shadow-lg border border-gray-200 bg-white p-1">
                                  {['ACTIVE','INACTIVE','VIP','BLOCKED'].map((s) => {
                                    const isSelected = customer.accountStatus.toUpperCase() === s;
                                    return (
                                      <SelectItem 
                                        key={s} 
                                        value={s}
                                        className={cn(
                                          "cursor-pointer rounded-md px-3 py-2.5 text-sm transition-colors pl-8",
                                          isSelected 
                                            ? "bg-cyan-500 text-white hover:bg-cyan-600 data-[highlighted]:bg-cyan-600 focus:bg-cyan-600" 
                                            : "text-gray-900 hover:bg-gray-100 data-[highlighted]:bg-gray-100 focus:bg-gray-100"
                                        )}
                                      >
                                        <span className={cn(isSelected ? "text-white font-medium" : "text-gray-900")}>{toDisplayStatus(s)}</span>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {formatDateHuman(customer.createdAt)}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4 text-gray-600" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
                                <DropdownMenuItem onClick={() => setDetailsCustomer(customer)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                const convertedCustomer: Customer = {
                                    id: customer.id,
                                  organizationId: customer.organizationId,
                                  name: customer.name,
                                    phone: customer.phone,
                                  email: customer.email,
                                  address: customer.address,
                                    latitude: customer.latitude,
                                    longitude: customer.longitude,
                                    vehicleType: customer.vehicleType,
                                    vehicleMake: customer.vehicleMake,
                                    vehicleModel: customer.vehicleModel,
                                    vehicleNumber: customer.vehicleNumber,
                                    vehicleYear: customer.vehicleYear,
                                    vehicleCondition: customer.vehicleCondition,
                                    accountStatus: customer.accountStatus,
                                    joinedDate: new Date(customer.joinedDate || customer.createdAt),
                                  createdAt: new Date(customer.createdAt),
                                  updatedAt: new Date(customer.updatedAt),
                                  };
                                setEditingCustomer(convertedCustomer);
                                setIsFormOpen(true);
                                }}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                    handleDeleteClick(customer);
                              }}
                                  className="text-red-600 focus:text-red-600"
                            >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      );
                    })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {customers.length === 0 ? (
                  <div className="py-8">
                    <NoDataAnimation />
                  </div>
                ) : (
                  customers.map((customer) => {
                  const isHighlighted = highlightedCustomerId === customer.id;
                  return (
                  <div 
                    key={customer.id} 
                    ref={isHighlighted ? highlightedRowRef : null}
                    className={cn(
                      "rounded-lg border bg-card p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-purple-50 cursor-pointer",
                      isHighlighted && "bg-cyan-50 border-cyan-200 border-2 animate-pulse"
                    )} 
                    onClick={() => setDetailsCustomer(customer)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <CustomerAvatar 
                          name={customer.name || 'N/A'} 
                          size="md"
                        />
                      <div>
                        <div className="font-semibold">{customer.name || 'N/A'}</div>
                        {customer.email && <div className="text-sm text-muted-foreground">{customer.email}</div>}
                      </div>
                      </div>
                      <StatusBadge status={customer.accountStatus} />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Phone</div>
                      <div>{customer.phone || 'N/A'}</div>
                      <div className="text-muted-foreground">Vehicle</div>
                      <div>
                        {(customer.vehicleType || customer.vehicleMake || customer.vehicleModel || customer.vehicleNumber || customer.vehicleCondition) ? (
                          <Button
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVehicleDetailsCustomer(customer);
                            }}
                            className="h-auto py-2 px-3 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 border border-cyan-200 hover:border-cyan-300 rounded-md transition-all w-full justify-start"
                          >
                            <Car className="h-4 w-4 mr-2" />
                            <span className="text-sm font-medium">View Vehicle</span>
                          </Button>
                        ) : (
                          <div className="text-gray-400 text-sm italic">No vehicle info</div>
                        )}
                      </div>
                      <div className="text-muted-foreground">Created</div>
                      <div>{formatDateHuman(customer.createdAt)}</div>
                    </div>
                    <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setDetailsCustomer(customer)} 
                        className="bg-cyan-50/50 hover:bg-cyan-100 text-cyan-600 hover:text-cyan-700 transition-all duration-200 border border-cyan-200/50 hover:border-cyan-300 shadow-sm hover:shadow-md z-10 relative"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                        const convertedCustomer: Customer = {
                          id: customer.id,
                          organizationId: customer.organizationId,
                          name: customer.name,
                          phone: customer.phone,
                          email: customer.email,
                          address: customer.address,
                          latitude: customer.latitude,
                          longitude: customer.longitude,
                          vehicleType: customer.vehicleType,
                          vehicleMake: customer.vehicleMake,
                          vehicleModel: customer.vehicleModel,
                          vehicleNumber: customer.vehicleNumber,
                          vehicleYear: customer.vehicleYear,
                          vehicleCondition: customer.vehicleCondition,
                          accountStatus: customer.accountStatus,
                          joinedDate: new Date(customer.joinedDate || customer.createdAt),
                          createdAt: new Date(customer.createdAt),
                          updatedAt: new Date(customer.updatedAt),
                        };
                        setEditingCustomer(convertedCustomer);
                        setIsFormOpen(true);
                        }} 
                        className="bg-cyan-50/50 hover:bg-cyan-100 text-cyan-600 hover:text-cyan-700 transition-all duration-200 border border-cyan-200/50 hover:border-cyan-300 shadow-sm hover:shadow-md z-10 relative"
                        title="Edit Customer"
                      >
                        <Edit2 className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(customer);
                        }} 
                        className="bg-red-50/50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 border border-red-200/50 hover:border-red-300 shadow-sm hover:shadow-md z-10 relative"
                        title="Delete Customer"
                        disabled={deleteCustomerMutation.isPending}
                      >
                        {deleteCustomerMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                  );
                  })
                )}
              </div>
            </>
          )}
        </CardContent>
        
        {/* Pagination Controls */}
        {!isLoading && pagination.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
            <div className="flex items-center gap-4">
              <RowsPerPage
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(value);
                  setCurrentPage(1);
                }}
                options={[5, 10, 20, 50, 100]}
              />
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalCustomers)} of {totalCustomers} customers
              </div>
            </div>
            <div className="flex items-center gap-2">
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
            </div>
          </div>
        )}
      </Card>

      {/* Sticky Add button for mobile */}
      <Button onClick={() => setIsFormOpen(true)} className="sm:hidden fixed bottom-6 right-6 rounded-full shadow-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white transform hover:scale-110 transition-all duration-200 hover:shadow-2xl">
        <Plus className="mr-2 h-4 w-4" /> Add Customer
      </Button>

      {/* Quick View Dialog */}
      <Dialog open={!!detailsCustomer} onOpenChange={(open) => !open && setDetailsCustomer(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-bold text-gray-900">Customer Details</DialogTitle>
            <div className="flex items-center gap-2">
          {detailsCustomer && (
                <Button 
                  onClick={() => {
                  const convertedCustomer: Customer = {
                      id: detailsCustomer.id,
                    organizationId: detailsCustomer.organizationId,
                    name: detailsCustomer.name,
                      phone: detailsCustomer.phone,
                    email: detailsCustomer.email,
                    address: detailsCustomer.address,
                      latitude: detailsCustomer.latitude,
                      longitude: detailsCustomer.longitude,
                      vehicleType: detailsCustomer.vehicleType,
                      vehicleMake: detailsCustomer.vehicleMake,
                      vehicleModel: detailsCustomer.vehicleModel,
                      vehicleNumber: detailsCustomer.vehicleNumber,
                      vehicleYear: detailsCustomer.vehicleYear,
                      vehicleCondition: detailsCustomer.vehicleCondition,
                      accountStatus: detailsCustomer.accountStatus,
                      joinedDate: new Date(detailsCustomer.joinedDate || detailsCustomer.createdAt),
                    createdAt: new Date(detailsCustomer.createdAt),
                    updatedAt: new Date(detailsCustomer.updatedAt),
                    };
                  setEditingCustomer(convertedCustomer);
                  setIsFormOpen(true);
                    setDetailsCustomer(null);
                  }}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white h-10 px-4"
                >
                  <Edit2 className="h-4 w-4 mr-2" /> Edit
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setDetailsCustomer(null)}
                className="h-10 px-4 border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-red-600 font-medium transition-all"
              >
                Cancel
              </Button>
              </div>
          </DialogHeader>
          {detailsCustomer && (
            <div className="space-y-4">
              {/* Customer Header with Avatar */}
              <div className="flex items-center gap-4">
                <CustomerAvatar 
                  name={detailsCustomer.name || 'N/A'} 
                  size="lg"
                />
                <div>
              <div className="text-xl font-bold text-gray-900">{detailsCustomer.name || 'N/A'}</div>
                  {detailsCustomer.email && (
                    <div className="text-sm text-gray-600 mt-1">{detailsCustomer.email}</div>
                  )}
                </div>
              </div>
              
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-muted-foreground">Phone</div>
                  <div className="font-medium">{detailsCustomer.phone || 'N/A'}</div>
                  {detailsCustomer.email && (
                    <>
                      <div className="text-muted-foreground">Email</div>
                      <div className="font-medium">{detailsCustomer.email}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Location Information */}
              {(detailsCustomer.address || detailsCustomer.latitude || detailsCustomer.longitude) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Location Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {detailsCustomer.address && (
                      <>
                        <div className="text-muted-foreground">Address</div>
                        <div className="font-medium break-words">{detailsCustomer.address}</div>
                      </>
                    )}
                    {(detailsCustomer.latitude !== undefined && detailsCustomer.latitude !== null) && (
                      <>
                        <div className="text-muted-foreground">Latitude</div>
                        <div className="font-medium font-mono text-xs">{detailsCustomer.latitude.toFixed(6)}</div>
                      </>
                    )}
                    {(detailsCustomer.longitude !== undefined && detailsCustomer.longitude !== null) && (
                      <>
                        <div className="text-muted-foreground">Longitude</div>
                        <div className="font-medium font-mono text-xs">{detailsCustomer.longitude.toFixed(6)}</div>
                      </>
                    )}
                    {(detailsCustomer.latitude && detailsCustomer.longitude) && (
                      <>
                        <div className="text-muted-foreground">Map</div>
                        <div>
                          <a
                            href={`https://www.google.com/maps?q=${detailsCustomer.latitude},${detailsCustomer.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 hover:text-cyan-700 hover:underline font-medium inline-flex items-center gap-1"
                          >
                            View on Google Maps
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Vehicle Information */}
              {(detailsCustomer.vehicleType || detailsCustomer.vehicleMake || detailsCustomer.vehicleModel || detailsCustomer.vehicleNumber || detailsCustomer.vehicleYear || detailsCustomer.vehicleCondition) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Vehicle Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {detailsCustomer.vehicleType && (
                      <>
                        <div className="text-muted-foreground">Vehicle Type</div>
                        <div className="font-medium capitalize">{detailsCustomer.vehicleType || 'N/A'}</div>
                      </>
                    )}
                    {detailsCustomer.vehicleCondition && (
                      <>
                        <div className="text-muted-foreground">Vehicle Condition</div>
                        <div className="font-medium capitalize">{String(detailsCustomer.vehicleCondition || '').replace(/_/g, ' ')}</div>
                      </>
                    )}
                    {detailsCustomer.vehicleMake && (
                      <>
                        <div className="text-muted-foreground">Vehicle Make</div>
                        <div className="font-medium">{detailsCustomer.vehicleMake}</div>
                      </>
                    )}
                    {detailsCustomer.vehicleModel && (
                      <>
                        <div className="text-muted-foreground">Vehicle Model</div>
                        <div className="font-medium">{detailsCustomer.vehicleModel}</div>
                      </>
                    )}
                    {detailsCustomer.vehicleNumber && (
                      <>
                        <div className="text-muted-foreground">Vehicle Number</div>
                        <div className="font-medium">{detailsCustomer.vehicleNumber}</div>
                      </>
                    )}
                    {detailsCustomer.vehicleYear && (
                      <>
                        <div className="text-muted-foreground">Vehicle Year</div>
                        <div className="font-medium">{detailsCustomer.vehicleYear}</div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Status and Metadata */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Status & Metadata</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-muted-foreground">Status</div>
                  <div><StatusBadge status={detailsCustomer.accountStatus} /></div>
                  <div className="text-muted-foreground">Created</div>
                  <div className="font-medium">{formatDateHuman(detailsCustomer.createdAt)}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Vehicle Details Dialog */}
      <Dialog open={!!vehicleDetailsCustomer} onOpenChange={(open) => !open && setVehicleDetailsCustomer(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Car className="h-5 w-5 text-cyan-600" />
              Vehicle Details
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setVehicleDetailsCustomer(null)}
                className="h-10 px-4 border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-red-600 font-medium transition-all"
              >
                Close
              </Button>
            </div>
          </DialogHeader>

          {vehicleDetailsCustomer && (
            <div className="space-y-6">
              {/* Customer Info Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <CustomerAvatar 
                  name={vehicleDetailsCustomer.name || 'N/A'} 
                  size="md"
                />
                <div>
                  <div className="text-lg font-bold text-gray-900">{vehicleDetailsCustomer.name || 'N/A'}</div>
                  {vehicleDetailsCustomer.email && (
                    <div className="text-sm text-gray-600 mt-1">{vehicleDetailsCustomer.email}</div>
                  )}
                </div>
              </div>

              {/* Vehicle Information */}
              {(vehicleDetailsCustomer.vehicleType || vehicleDetailsCustomer.vehicleMake || vehicleDetailsCustomer.vehicleModel || vehicleDetailsCustomer.vehicleNumber || vehicleDetailsCustomer.vehicleYear || vehicleDetailsCustomer.vehicleCondition) ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                      Vehicle Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {vehicleDetailsCustomer.vehicleType && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Vehicle Type</span>
                          <span className="px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-md text-sm font-medium capitalize">{vehicleDetailsCustomer.vehicleType}</span>
                        </div>
                      )}
                      {vehicleDetailsCustomer.vehicleMake && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Vehicle Make</span>
                          <span className="text-sm font-medium text-gray-900">{vehicleDetailsCustomer.vehicleMake}</span>
                        </div>
                      )}
                      {vehicleDetailsCustomer.vehicleModel && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Vehicle Model</span>
                          <span className="text-sm font-medium text-gray-900">{vehicleDetailsCustomer.vehicleModel}</span>
                        </div>
                      )}
                      {vehicleDetailsCustomer.vehicleNumber && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Vehicle Number</span>
                          <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm font-mono font-semibold">{vehicleDetailsCustomer.vehicleNumber}</span>
                        </div>
                      )}
                      {vehicleDetailsCustomer.vehicleYear && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Vehicle Year</span>
                          <span className="text-sm font-medium text-gray-900">{vehicleDetailsCustomer.vehicleYear}</span>
                        </div>
                      )}
                      {vehicleDetailsCustomer.vehicleCondition && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Vehicle Condition</span>
                          <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-md text-sm font-medium capitalize">{String(vehicleDetailsCustomer.vehicleCondition).replace(/_/g, ' ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Car className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">No vehicle information available</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CustomerForm
        customer={editingCustomer}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCustomer(undefined);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px] [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Delete Customer
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this customer? This action cannot be undone.
            </p>
            {customerToDelete && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <CustomerAvatar 
                    name={customerToDelete.name || 'N/A'} 
                    size="md"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {customerToDelete.name || 'N/A'}
                    </p>
                    {customerToDelete.email && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {customerToDelete.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setCustomerToDelete(null);
              }}
              disabled={deleteCustomerMutation.isPending}
              className="border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteCustomerMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteCustomerMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Customer
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
