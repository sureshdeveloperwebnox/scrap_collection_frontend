'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderForm } from '@/components/order-form';
import { Order, OrderStatus, PaymentStatusEnum } from '@/types';
import { Plus, Search, Edit2, Trash2, Loader2, CheckCircle2, Clock, ChevronDown, ArrowUpDown, Eye, MoreHorizontal, Download, Filter, Check, X, Package, MapPin, User, DollarSign, Calendar } from 'lucide-react';
import { useOrders, useDeleteOrder, useUpdateOrder, useUpdateOrderStatus, useAssignCollector } from '@/hooks/use-orders';
import { useOrderStats } from '@/hooks/use-order-stats';
import { useOrderStatsStore } from '@/lib/store/order-stats-store';
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
import { ordersApi } from '@/lib/api';
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
    fetch('/animation/nodatafoundanimation.json')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load animation');
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
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <div className="mt-2 text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!animationData) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-gray-400 text-sm">No orders found</div>
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
      <p className="mt-4 text-gray-600 text-sm font-medium">No orders found</p>
      <p className="mt-1 text-gray-400 text-xs">Try adjusting your filters or create a new order</p>
    </div>
  );
}

// API response type - matches backend Order model
interface ApiOrder {
  id: string;
  leadId?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerCountryCode?: string;
  address: string;
  latitude?: number;
  longitude?: number;
  vehicleDetails: {
    make?: string;
    model?: string;
    year?: number;
    condition?: string;
  };
  assignedCollectorId?: string;
  assignedCollector?: {
    id: string;
    fullName: string;
    email: string;
  };
  pickupTime?: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatusEnum;
  quotedPrice?: number;
  actualPrice?: number;
  yardId?: string;
  customerNotes?: string;
  adminNotes?: string;
  organizationId: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  version: string;
  validationErrors: any[];
  code: number;
  status: string;
  message: string;
  data: {
    orders: ApiOrder[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

type SortKey = 'customerName' | 'createdAt' | 'orderStatus' | 'paymentStatus';

function formatDateHuman(dateStr: string): string {
  const date = new Date(dateStr);
  
  if (typeof window !== 'undefined') {
    const today = new Date();
    const yday = new Date();
    yday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, yday)) return 'Yesterday';
  }
  
  const day = date.getUTCDate().toString().padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${day} ${month}, ${year}`;
}

function toDisplayOrderStatus(status: string): string {
  const s = status?.toUpperCase();
  const statusMap: Record<string, string> = {
    'PENDING': 'Pending',
    'ASSIGNED': 'Assigned',
    'IN_PROGRESS': 'In Progress',
    'COMPLETED': 'Completed',
    'CANCELLED': 'Cancelled'
  };
  return statusMap[s] || status;
}

function toDisplayPaymentStatus(status: string): string {
  const s = status?.toUpperCase();
  const statusMap: Record<string, string> = {
    'UNPAID': 'Unpaid',
    'PAID': 'Paid',
    'REFUNDED': 'Refunded'
  };
  return statusMap[s] || status;
}

// Tab color styles for order status
type TabKey = 'All' | 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
function getTabStyle(tab: TabKey) {
  switch (tab) {
    case 'All':
      return { activeText: 'text-cyan-700', activeBg: 'bg-cyan-50', underline: 'bg-cyan-500', count: 'bg-cyan-100 text-cyan-700' };
    case 'Pending':
      return { activeText: 'text-yellow-700', activeBg: 'bg-yellow-50', underline: 'bg-yellow-600', count: 'bg-yellow-100 text-yellow-700' };
    case 'Assigned':
      return { activeText: 'text-blue-700', activeBg: 'bg-blue-50', underline: 'bg-blue-600', count: 'bg-blue-100 text-blue-700' };
    case 'In Progress':
      return { activeText: 'text-orange-700', activeBg: 'bg-orange-50', underline: 'bg-orange-600', count: 'bg-orange-100 text-orange-700' };
    case 'Completed':
      return { activeText: 'text-green-700', activeBg: 'bg-green-50', underline: 'bg-green-600', count: 'bg-green-100 text-green-700' };
    case 'Cancelled':
      return { activeText: 'text-red-700', activeBg: 'bg-red-50', underline: 'bg-red-600', count: 'bg-red-100 text-red-700' };
    default:
      return { activeText: 'text-primary', activeBg: 'bg-muted', underline: 'bg-primary', count: 'bg-muted text-foreground' };
  }
}

// Order Avatar Component
function OrderAvatar({ 
  name, 
  size = 'md',
  className = ''
}: { 
  name: string; 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const firstLetter = (name || 'O').charAt(0).toUpperCase();
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg'
  };
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-300 ${className}`}>
      <span className="text-white font-semibold leading-none">
        {firstLetter}
      </span>
    </div>
  );
}

function OrderStatusBadge({ status, showDropdownIcon = false }: { status: string; showDropdownIcon?: boolean }) {
  const safeStatus = status || 'PENDING';
  const display = toDisplayOrderStatus(safeStatus);
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap';
  
  let badgeContent = null;
  
  if (safeStatus === 'PENDING') {
    badgeContent = (
      <span className={`${base} bg-yellow-100 text-yellow-800`}>
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">Pending</span>
        {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
      </span>
    );
  } else if (safeStatus === 'ASSIGNED') {
    badgeContent = (
      <span className={`${base} bg-blue-100 text-blue-800`}>
        <User className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">Assigned</span>
        {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
      </span>
    );
  } else if (safeStatus === 'IN_PROGRESS') {
    badgeContent = (
      <span className={`${base} bg-orange-100 text-orange-800`}>
        <Package className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">In Progress</span>
        {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
      </span>
    );
  } else if (safeStatus === 'COMPLETED') {
    badgeContent = (
      <span className={`${base} bg-green-100 text-green-800`}>
        <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">Completed</span>
        {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
      </span>
    );
  } else if (safeStatus === 'CANCELLED') {
    badgeContent = (
      <span className={`${base} bg-red-100 text-red-800`}>
        <X className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">Cancelled</span>
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

function PaymentStatusBadge({ status }: { status: string }) {
  const safeStatus = status || 'UNPAID';
  const display = toDisplayPaymentStatus(safeStatus);
  const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap';
  
  if (safeStatus === 'PAID') {
    return (
      <span className={`${base} bg-green-100 text-green-800`}>
        <DollarSign className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">Paid</span>
      </span>
    );
  } else if (safeStatus === 'UNPAID') {
    return (
      <span className={`${base} bg-yellow-100 text-yellow-800`}>
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">Unpaid</span>
      </span>
    );
  } else if (safeStatus === 'REFUNDED') {
    return (
      <span className={`${base} bg-red-100 text-red-800`}>
        <X className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">Refunded</span>
      </span>
    );
  }
  
  return (
    <span className={`${base} bg-gray-100 text-gray-800`}>
      <span className="whitespace-nowrap">{display}</span>
    </span>
  );
}

export default function OrdersPage() {
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
  const [editingOrder, setEditingOrder] = useState<Order | undefined>();
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled'>('All');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  
  // Sorting state
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [detailsOrder, setDetailsOrder] = useState<ApiOrder | null>(null);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<ApiOrder | null>(null);
  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Selection state
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
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
      setHighlightedOrderId(highlightId);
      setTimeout(() => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.delete('highlight');
        const newUrl = newSearchParams.toString() 
          ? `${window.location.pathname}?${newSearchParams.toString()}`
          : window.location.pathname;
        router.replace(newUrl);
        setTimeout(() => setHighlightedOrderId(null), 3000);
      }, 100);
    }
  }, [searchParams, router]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Map tab to status for API
  const getStatusFromTab = (tab: string): OrderStatus | undefined => {
    const statusMap: Record<string, OrderStatus> = {
      'Pending': 'PENDING',
      'Assigned': 'ASSIGNED',
      'In Progress': 'IN_PROGRESS',
      'Completed': 'COMPLETED',
      'Cancelled': 'CANCELLED'
    };
    return tab === 'All' ? undefined : statusMap[tab];
  };

  // Map sort key to API sortBy
  const getApiSortBy = (key: SortKey): 'customerName' | 'createdAt' | 'orderStatus' | 'paymentStatus' => {
    const sortMap: Record<SortKey, 'customerName' | 'createdAt' | 'orderStatus' | 'paymentStatus'> = {
      'customerName': 'customerName',
      'createdAt': 'createdAt',
      'orderStatus': 'orderStatus',
      'paymentStatus': 'paymentStatus'
    };
    return sortMap[key] || 'createdAt';
  };

  // Memoize payment filter value
  const paymentFilterValue = useMemo(() => paymentFilter !== 'ALL' ? paymentFilter as PaymentStatusEnum : undefined, [paymentFilter]);
  
  // Memoize query parameters for better performance
  const queryParams = useMemo(() => {
    const status = getStatusFromTab(activeTab);
    const sortBy = getApiSortBy(sortKey);
    return {
      page: currentPage,
      limit: rowsPerPage,
      search: debouncedSearchTerm || undefined,
      status: status,
      paymentStatus: paymentFilterValue,
      sortBy: sortBy,
      sortOrder: sortDir,
    };
  }, [currentPage, rowsPerPage, debouncedSearchTerm, activeTab, paymentFilterValue, sortKey, sortDir]);

  // API hooks with server-side pagination, filtering, and sorting
  const { data: ordersData, isLoading, error } = useOrders(queryParams);
  const deleteOrderMutation = useDeleteOrder();
  const updateOrderMutation = useUpdateOrder();
  const updateOrderStatusMutation = useUpdateOrderStatus();
  const assignCollectorMutation = useAssignCollector();

  // Fetch and sync order stats to Zustand store
  useOrderStats();
  
  // Get stats from Zustand store
  const stats = useOrderStatsStore((state) => state.stats) || {
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    unpaid: 0,
    paid: 0,
    refunded: 0,
  };

  // Handle the actual API response structure
  const apiResponse = ordersData as unknown as ApiResponse;
  const orders = useMemo(() => apiResponse?.data?.orders || [], [apiResponse]);
  const pagination = useMemo(() => apiResponse?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  }, [apiResponse]);
  
  // Scroll to highlighted row when data is loaded
  useEffect(() => {
    if (highlightedOrderId && highlightedRowRef.current && orders && orders.length > 0) {
      setTimeout(() => {
        highlightedRowRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
    }
  }, [highlightedOrderId, orders]);

  const totalOrders = pagination.total;

  // Map stats to tab counts
  const getTabCount = (tab: string): number => {
    switch (tab) {
      case 'All':
        return stats.total || 0;
      case 'Pending':
        return stats.pending || 0;
      case 'Assigned':
        return stats.assigned || 0;
      case 'In Progress':
        return stats.inProgress || 0;
      case 'Completed':
        return stats.completed || 0;
      case 'Cancelled':
        return stats.cancelled || 0;
      default:
        return 0;
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, paymentFilter, rowsPerPage]);

  // Prefetch next page for better UX
  useEffect(() => {
    if (currentPage < pagination.totalPages && organizationId) {
      const nextPageParams = {
        ...queryParams,
        page: currentPage + 1,
        organizationId,
      };
      queryClient.prefetchQuery({
        queryKey: queryKeys.orders.list(nextPageParams),
        queryFn: () => ordersApi.getOrders(nextPageParams),
        staleTime: 3 * 60 * 1000,
      });
    }
  }, [currentPage, pagination.totalPages, queryClient, organizationId, queryParams]);

  const handleDeleteClick = (order: ApiOrder) => {
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orderToDelete) return;
    
    try {
      await deleteOrderMutation.mutateAsync(orderToDelete.id);
      toast.success(`Order "${orderToDelete.customerName}" deleted successfully`);
      setDeleteConfirmOpen(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
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
      setSelectedOrders(new Set(orders.map(order => order.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const isAllSelected = orders.length > 0 && selectedOrders.size === orders.length;
  const isIndeterminate = selectedOrders.size > 0 && selectedOrders.size < orders.length;

  // Handle export
  const handleExport = () => {
    if (selectedOrders.size === 0) {
      toast.info('Please select orders to export');
      return;
    }
    toast.success(`Exporting ${selectedOrders.size} orders...`);
    // TODO: Implement export functionality
  };

  const onInlineStatusChange = async (order: ApiOrder, value: string) => {
    try {
      const validStatuses = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(value.toUpperCase())) {
        toast.error(`Invalid status: ${value}`);
        return;
      }

      const normalizedStatus = value.toUpperCase() as OrderStatus;
      
      if (order.orderStatus.toUpperCase() === normalizedStatus) {
        return;
      }

      await updateOrderStatusMutation.mutateAsync({ 
        orderId: String(order.id), 
        status: normalizedStatus
      });
      toast.success('Status updated successfully');
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
          <h2 className="text-xl font-semibold text-red-600">Error loading orders</h2>
          <p className="text-gray-600 mt-2">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-cyan-700">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-700">{stats.total || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{stats.pending || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{stats.assigned || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{stats.inProgress || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{stats.completed || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{stats.cancelled || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List Card */}
      <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-xl font-bold text-gray-900">Work Orders</CardTitle>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-gray-900 active:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed h-9 w-9 p-0"
              >
                <Search className="h-4 w-4" />
              </Button>
              
              {isSearchOpen && (
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={() => {
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
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-gray-900 active:bg-gray-200 transition-all h-9 w-9 p-0 ${
                  paymentFilter !== 'ALL' ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : ''
                } ${
                  isFilterOpen ? 'border-cyan-500 bg-cyan-50' : ''
                }`}
                title={isFilterOpen ? "Hide filters" : "Show filters"}
              >
                <Filter className={`h-4 w-4 ${paymentFilter !== 'ALL' ? 'text-cyan-700' : ''}`} />
              </Button>
              
              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 w-9 p-0"
                title="Add Order"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Payment Filter - Only shown when filter icon is clicked */}
          {isFilterOpen && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Payment:</Label>
                  <Select 
                    value={paymentFilter || 'ALL'} 
                    onValueChange={(v) => {
                      setPaymentFilter(v);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className={`w-[200px] bg-white border-gray-200 hover:border-gray-300 transition-all ${
                      paymentFilter !== 'ALL' ? 'border-cyan-500 ring-2 ring-cyan-200' : ''
                    }`}>
                      <SelectValue placeholder="All Payment Status">
                        {paymentFilter === 'ALL' ? 'All Payment Status' : toDisplayPaymentStatus(paymentFilter)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Payment Status</SelectItem>
                      <SelectItem value="UNPAID">Unpaid</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="REFUNDED">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                  {paymentFilter !== 'ALL' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPaymentFilter('ALL');
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
              <span className="ml-2 text-gray-600">Loading orders...</span>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="overflow-x-auto hidden sm:block">
                <Table>
                  <TableHeader className="bg-white">
                    {/* Status Tabs Row */}
                    <TableRow className="hover:bg-transparent border-b-2 border-gray-200 bg-gray-50">
                      <TableHead colSpan={9} className="p-0 bg-transparent">
                        <div className="w-full overflow-x-auto">
                          <div className="inline-flex items-center gap-1 px-2 py-2">
                            {(['All','Pending','Assigned','In Progress','Completed','Cancelled'] as const).map((tab) => {
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
                                    setCurrentPage(1);
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
                        <button className="inline-flex items-center gap-1 hover:text-cyan-600 transition-colors" onClick={() => toggleSort('customerName')}>
                          Customer 
                          {sortKey === 'customerName' && <ArrowUpDown className="h-3 w-3" />}
                        </button>
                      </TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Collector</TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-cyan-600 transition-colors" onClick={() => toggleSort('orderStatus')}>
                          Order Status 
                          {sortKey === 'orderStatus' && <ArrowUpDown className="h-3 w-3" />}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-cyan-600 transition-colors" onClick={() => toggleSort('paymentStatus')}>
                          Payment 
                          {sortKey === 'paymentStatus' && <ArrowUpDown className="h-3 w-3" />}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-cyan-600 transition-colors" onClick={() => toggleSort('createdAt')}>
                          Created Date 
                          {sortKey === 'createdAt' && <ArrowUpDown className="h-3 w-3" />}
                        </button>
                      </TableHead>
                      <TableHead className="w-12">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-12">
                          <NoDataAnimation />
                        </TableCell>
                      </TableRow>
                    ) : (
                      orders.map((order) => {
                        const isHighlighted = highlightedOrderId === order.id;
                        return (
                          <TableRow 
                            key={order.id}
                            ref={isHighlighted ? highlightedRowRef : null}
                            className={cn(
                              "border-b hover:bg-gray-50 transition-colors bg-white cursor-pointer",
                              isHighlighted && "bg-cyan-50 border-cyan-200 border-2 animate-pulse"
                            )}
                            onClick={() => setDetailsOrder(order)}
                          >
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedOrders.has(order.id)}
                                onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                                onClick={(e) => e.stopPropagation()}
                                className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <OrderAvatar 
                                  name={order.customerName || 'N/A'} 
                                  size="md"
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">{order.customerName || 'N/A'}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-gray-900">{order.customerPhone || 'N/A'}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 max-w-[200px]">
                                <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                <span className="truncate text-sm text-gray-700">{order.address || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {order.vehicleDetails ? (
                                <div className="text-sm">
                                  {order.vehicleDetails.make && order.vehicleDetails.model ? (
                                    <span className="text-gray-900">{order.vehicleDetails.make} {order.vehicleDetails.model}</span>
                                  ) : (
                                    <span className="text-gray-400 italic">No vehicle info</span>
                                  )}
                                </div>
                              ) : (
                                <div className="text-gray-400 text-sm italic">No vehicle info</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {order.assignedCollector ? (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm text-gray-700">{order.assignedCollector.fullName}</span>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    assignCollectorMutation.mutate({
                                      orderId: order.id,
                                      collectorId: 'auto' // This would need actual collector selection
                                    });
                                  }}
                                  className="h-7 text-xs"
                                >
                                  Assign
                                </Button>
                              )}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <Select 
                                value={order.orderStatus || 'PENDING'} 
                                onValueChange={(v) => onInlineStatusChange(order, v)}
                              >
                                <SelectTrigger className="h-auto w-auto p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none max-w-none min-w-0 overflow-visible">
                                  <div className="flex items-center">
                                    <OrderStatusBadge status={order.orderStatus || 'PENDING'} showDropdownIcon={true} />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="min-w-[160px] rounded-lg shadow-lg border border-gray-200 bg-white p-1">
                                  {(['PENDING','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED'] as OrderStatus[]).map((s) => {
                                    const isSelected = (order.orderStatus || 'PENDING') === s;
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
                                        <span className={cn(isSelected ? "text-white font-medium" : "text-gray-900")}>{toDisplayOrderStatus(s)}</span>
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <PaymentStatusBadge status={order.paymentStatus} />
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {formatDateHuman(order.createdAt)}
                            </TableCell>
                            <TableCell onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4 text-gray-600" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40" onClick={(e) => e.stopPropagation()}>
                                  <DropdownMenuItem onClick={() => setDetailsOrder(order)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => {
                                    const convertedOrder: Order = {
                                      id: order.id,
                                      leadId: order.leadId,
                                      customerId: order.customerId,
                                      customerName: order.customerName,
                                      customerPhone: order.customerPhone,
                                      customerCountryCode: order.customerCountryCode,
                                      address: order.address,
                                      latitude: order.latitude,
                                      longitude: order.longitude,
                                      vehicleDetails: order.vehicleDetails,
                                      assignedCollectorId: order.assignedCollectorId,
                                      pickupTime: order.pickupTime ? new Date(order.pickupTime) : undefined,
                                      orderStatus: order.orderStatus,
                                      paymentStatus: order.paymentStatus,
                                      quotedPrice: order.quotedPrice,
                                      actualPrice: order.actualPrice,
                                      yardId: order.yardId,
                                      customerNotes: order.customerNotes,
                                      adminNotes: order.adminNotes,
                                      organizationId: order.organizationId,
                                      createdAt: new Date(order.createdAt),
                                      updatedAt: new Date(order.updatedAt),
                                    };
                                    setEditingOrder(convertedOrder);
                                    setIsFormOpen(true);
                                  }}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClick(order);
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
                {orders.length === 0 ? (
                  <div className="py-8">
                    <NoDataAnimation />
                  </div>
                ) : (
                  orders.map((order) => {
                    const isHighlighted = highlightedOrderId === order.id;
                    return (
                      <div 
                        key={order.id} 
                        ref={isHighlighted ? highlightedRowRef : null}
                        className={cn(
                          "rounded-lg border bg-card p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-purple-50 cursor-pointer",
                          isHighlighted && "bg-cyan-50 border-cyan-200 border-2 animate-pulse"
                        )} 
                        onClick={() => setDetailsOrder(order)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <OrderAvatar 
                              name={order.customerName || 'N/A'} 
                              size="md"
                            />
                            <div>
                              <div className="font-semibold">{order.customerName || 'N/A'}</div>
                              <div className="text-sm text-muted-foreground">{order.customerPhone || 'N/A'}</div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <OrderStatusBadge status={order.orderStatus} />
                            <PaymentStatusBadge status={order.paymentStatus} />
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div className="text-muted-foreground">Address</div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="truncate">{order.address || 'N/A'}</span>
                          </div>
                          <div className="text-muted-foreground">Vehicle</div>
                          <div>
                            {order.vehicleDetails?.make && order.vehicleDetails?.model ? (
                              <span>{order.vehicleDetails.make} {order.vehicleDetails.model}</span>
                            ) : (
                              <span className="text-gray-400 text-sm italic">No vehicle info</span>
                            )}
                          </div>
                          <div className="text-muted-foreground">Collector</div>
                          <div>
                            {order.assignedCollector ? (
                              <span className="text-sm">{order.assignedCollector.fullName}</span>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  assignCollectorMutation.mutate({
                                    orderId: order.id,
                                    collectorId: 'auto'
                                  });
                                }}
                                className="h-7 text-xs"
                              >
                                Assign
                              </Button>
                            )}
                          </div>
                          <div className="text-muted-foreground">Created</div>
                          <div>{formatDateHuman(order.createdAt)}</div>
                        </div>
                        <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setDetailsOrder(order)} 
                            className="bg-cyan-50/50 hover:bg-cyan-100 text-cyan-600 hover:text-cyan-700 transition-all duration-200 border border-cyan-200/50 hover:border-cyan-300 shadow-sm hover:shadow-md z-10 relative"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              const convertedOrder: Order = {
                                id: order.id,
                                leadId: order.leadId,
                                customerId: order.customerId,
                                customerName: order.customerName,
                                customerPhone: order.customerPhone,
                                customerCountryCode: order.customerCountryCode,
                                address: order.address,
                                latitude: order.latitude,
                                longitude: order.longitude,
                                vehicleDetails: order.vehicleDetails,
                                assignedCollectorId: order.assignedCollectorId,
                                pickupTime: order.pickupTime ? new Date(order.pickupTime) : undefined,
                                orderStatus: order.orderStatus,
                                paymentStatus: order.paymentStatus,
                                quotedPrice: order.quotedPrice,
                                actualPrice: order.actualPrice,
                                yardId: order.yardId,
                                customerNotes: order.customerNotes,
                                adminNotes: order.adminNotes,
                                organizationId: order.organizationId,
                                createdAt: new Date(order.createdAt),
                                updatedAt: new Date(order.updatedAt),
                              };
                              setEditingOrder(convertedOrder);
                              setIsFormOpen(true);
                            }} 
                            className="bg-cyan-50/50 hover:bg-cyan-100 text-cyan-600 hover:text-cyan-700 transition-all duration-200 border border-cyan-200/50 hover:border-cyan-300 shadow-sm hover:shadow-md z-10 relative"
                            title="Edit Order"
                          >
                            <Edit2 className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(order);
                            }} 
                            className="bg-red-50/50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 border border-red-200/50 hover:border-red-300 shadow-sm hover:shadow-md z-10 relative"
                            title="Delete Order"
                            disabled={deleteOrderMutation.isPending}
                          >
                            {deleteOrderMutation.isPending ? (
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
                Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalOrders)} of {totalOrders} orders
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
        <Plus className="mr-2 h-4 w-4" /> Add Order
      </Button>

      {/* Quick View Dialog */}
      <Dialog open={!!detailsOrder} onOpenChange={(open) => !open && setDetailsOrder(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-bold text-gray-900">Order Details</DialogTitle>
            <div className="flex items-center gap-2">
              {detailsOrder && (
                <Button 
                  onClick={() => {
                    const convertedOrder: Order = {
                      id: detailsOrder.id,
                      leadId: detailsOrder.leadId,
                      customerId: detailsOrder.customerId,
                      customerName: detailsOrder.customerName,
                      customerPhone: detailsOrder.customerPhone,
                      customerCountryCode: detailsOrder.customerCountryCode,
                      address: detailsOrder.address,
                      latitude: detailsOrder.latitude,
                      longitude: detailsOrder.longitude,
                      vehicleDetails: detailsOrder.vehicleDetails,
                      assignedCollectorId: detailsOrder.assignedCollectorId,
                      pickupTime: detailsOrder.pickupTime ? new Date(detailsOrder.pickupTime) : undefined,
                      orderStatus: detailsOrder.orderStatus,
                      paymentStatus: detailsOrder.paymentStatus,
                      quotedPrice: detailsOrder.quotedPrice,
                      actualPrice: detailsOrder.actualPrice,
                      yardId: detailsOrder.yardId,
                      customerNotes: detailsOrder.customerNotes,
                      adminNotes: detailsOrder.adminNotes,
                      organizationId: detailsOrder.organizationId,
                      createdAt: new Date(detailsOrder.createdAt),
                      updatedAt: new Date(detailsOrder.updatedAt),
                    };
                    setEditingOrder(convertedOrder);
                    setIsFormOpen(true);
                    setDetailsOrder(null);
                  }}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setDetailsOrder(null)}
                className="border-gray-200 bg-white hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          {detailsOrder && (
            <div className="space-y-6 py-4">
              {/* Customer Information */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                    Customer Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Customer Name</span>
                      <span className="text-sm font-medium text-gray-900">{detailsOrder.customerName}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Phone</span>
                      <span className="text-sm font-medium text-gray-900">{detailsOrder.customerPhone}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Address</span>
                      <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">{detailsOrder.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Information */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                    Order Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Order Status</span>
                      <OrderStatusBadge status={detailsOrder.orderStatus} />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Payment Status</span>
                      <PaymentStatusBadge status={detailsOrder.paymentStatus} />
                    </div>
                    {detailsOrder.quotedPrice && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Quoted Price</span>
                        <span className="text-sm font-medium text-gray-900">${detailsOrder.quotedPrice.toFixed(2)}</span>
                      </div>
                    )}
                    {detailsOrder.actualPrice && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Actual Price</span>
                        <span className="text-sm font-medium text-green-600">${detailsOrder.actualPrice.toFixed(2)}</span>
                      </div>
                    )}
                    {detailsOrder.pickupTime && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Pickup Time</span>
                        <span className="text-sm font-medium text-gray-900">{formatDateHuman(detailsOrder.pickupTime)}</span>
                      </div>
                    )}
                    {detailsOrder.assignedCollector && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Assigned Collector</span>
                        <span className="text-sm font-medium text-gray-900">{detailsOrder.assignedCollector.fullName}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              {detailsOrder.vehicleDetails && (detailsOrder.vehicleDetails.make || detailsOrder.vehicleDetails.model || detailsOrder.vehicleDetails.year || detailsOrder.vehicleDetails.condition) && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                      Vehicle Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {detailsOrder.vehicleDetails.make && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Make</span>
                          <span className="text-sm font-medium text-gray-900">{detailsOrder.vehicleDetails.make}</span>
                        </div>
                      )}
                      {detailsOrder.vehicleDetails.model && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Model</span>
                          <span className="text-sm font-medium text-gray-900">{detailsOrder.vehicleDetails.model}</span>
                        </div>
                      )}
                      {detailsOrder.vehicleDetails.year && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Year</span>
                          <span className="text-sm font-medium text-gray-900">{detailsOrder.vehicleDetails.year}</span>
                        </div>
                      )}
                      {detailsOrder.vehicleDetails.condition && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Condition</span>
                          <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-md text-sm font-medium capitalize">{String(detailsOrder.vehicleDetails.condition).replace(/_/g, ' ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {(detailsOrder.customerNotes || detailsOrder.adminNotes) && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Notes</h3>
                    {detailsOrder.customerNotes && (
                      <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Customer Notes</div>
                        <div className="text-sm text-gray-700">{detailsOrder.customerNotes}</div>
                      </div>
                    )}
                    {detailsOrder.adminNotes && (
                      <div className="p-3 bg-white rounded-lg border border-gray-200">
                        <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Admin Notes</div>
                        <div className="text-sm text-gray-700">{detailsOrder.adminNotes}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <OrderForm
        order={editingOrder}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingOrder(undefined);
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
              Delete Order
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this order? This action cannot be undone.
            </p>
            {orderToDelete && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-3">
                  <OrderAvatar 
                    name={orderToDelete.customerName || 'N/A'} 
                    size="md"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {orderToDelete.customerName || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Order #{orderToDelete.id.slice(0, 8)}
                    </p>
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
                setOrderToDelete(null);
              }}
              disabled={deleteOrderMutation.isPending}
              className="border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteOrderMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteOrderMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Order
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
