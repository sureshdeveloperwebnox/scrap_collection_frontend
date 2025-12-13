'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LeadForm } from '@/components/lead-form';
import { CustomerForm } from '@/components/customer-form';
import { Lead, Customer, CustomerStatus } from '@/types';
import { Plus, Search, Edit2, Trash2, Loader2, CheckCircle2, Clock, ChevronDown, ArrowUpDown, Eye, MoreHorizontal, Download, Filter, Check, X, Car, UserPlus } from 'lucide-react';
import { useLeads, useDeleteLead, useUpdateLead } from '@/hooks/use-leads';
import { useLeadStats } from '@/hooks/use-lead-stats';
import { useLeadStatsStore } from '@/lib/store/lead-stats-store';
import { getImageUrl, getImageUrls } from '@/utils/image-utils';
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
import { leadsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

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
        <div className="text-gray-400 text-sm">No leads found</div>
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
      <p className="mt-4 text-gray-600 text-sm font-medium">No leads found</p>
      <p className="mt-1 text-gray-400 text-xs">Try adjusting your filters or create a new lead</p>
    </div>
  );
}

// API response type - matches backend Lead model
interface ApiLead {
  id: string;
  organizationId: number;
  fullName: string;
  phone: string;
  email?: string;
  vehicleType: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleCondition: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  leadSource: string;
  photos?: string[];
  notes?: string;
  status: string;
  customerId?: string;
  createdAt: string;
  updatedAt: string;
  organization?: {
    name: string;
  };
  customer?: any;
}

interface ApiResponse {
  version: string;
  validationErrors: any[];
  code: number;
  status: string;
  message: string;
  data: {
    leads: ApiLead[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

type SortKey = 'fullName' | 'createdAt' | 'status';

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

function toDisplayStatus(status: string): 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Rejected' | string {
  const s = status?.toUpperCase();
  if (s === 'PENDING' || s === 'NEW') return 'New';
  if (s === 'CONTACTED') return 'Contacted';
  if (s === 'QUOTED' || s === 'QUALIFIED') return 'Qualified';
  if (s === 'CONVERTED') return 'Converted';
  if (s === 'REJECTED') return 'Rejected';
  return status;
}

// Tab color styles
type TabKey = 'All' | 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Rejected';
function getTabStyle(tab: TabKey) {
  switch (tab) {
    case 'All':
      return { activeText: 'text-cyan-700', activeBg: 'bg-cyan-50', underline: 'bg-cyan-500', count: 'bg-cyan-100 text-cyan-700' };
    case 'New':
      return { activeText: 'text-cyan-700', activeBg: 'bg-cyan-50', underline: 'bg-cyan-500', count: 'bg-cyan-100 text-cyan-700' };
    case 'Contacted':
      return { activeText: 'text-indigo-700', activeBg: 'bg-indigo-50', underline: 'bg-indigo-600', count: 'bg-indigo-100 text-indigo-700' };
    case 'Qualified':
      return { activeText: 'text-teal-700', activeBg: 'bg-teal-50', underline: 'bg-teal-600', count: 'bg-teal-100 text-teal-700' };
    case 'Converted':
      return { activeText: 'text-green-700', activeBg: 'bg-green-50', underline: 'bg-green-600', count: 'bg-green-100 text-green-700' };
    case 'Rejected':
      return { activeText: 'text-rose-700', activeBg: 'bg-rose-50', underline: 'bg-rose-600', count: 'bg-rose-100 text-rose-700' };
    default:
      return { activeText: 'text-primary', activeBg: 'bg-muted', underline: 'bg-primary', count: 'bg-muted text-foreground' };
  }
}

// Reusable Lead Avatar Component - Always shows first letter, no images
// Inspired by modern avatar design with circular shape and gradient
function LeadAvatar({ 
  name, 
  imageUrl, 
  size = 'md',
  className = ''
}: { 
  name: string; 
  imageUrl?: string | null; // Not used, kept for API compatibility
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const firstLetter = (name || 'N').charAt(0).toUpperCase();
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg'
  };
  
  // Always show letter-based avatar with circular design, never load images
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
  
  if (display === 'Converted') {
    badgeContent = (
      <span className={`${base} bg-green-100 text-green-800`}>
        <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">Converted</span>
        {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
      </span>
    );
  } else if (display === 'New') {
    badgeContent = (
      <span className={`${base} bg-blue-100 text-blue-800`}>
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">New</span>
        {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
      </span>
    );
  } else if (display === 'Contacted') {
    badgeContent = (
      <span className={`${base} bg-indigo-100 text-indigo-800`}>
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">Contacted</span>
        {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
      </span>
    );
  } else if (display === 'Qualified') {
    badgeContent = (
      <span className={`${base} bg-teal-100 text-teal-800`}>
        <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">Qualified</span>
        {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
      </span>
    );
  } else if (display === 'Rejected') {
    badgeContent = (
      <span className={`${base} bg-red-100 text-red-800`}>
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">Rejected</span>
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

export default function LeadsPage() {
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
  const [editingLead, setEditingLead] = useState<Lead | undefined>();
  const [activeTab, setActiveTab] = useState<'All' | 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Rejected'>('All');
  const [scrapFilter, setScrapFilter] = useState<string>('ALL');
  
  // Sorting state
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [detailsLead, setDetailsLead] = useState<ApiLead | null>(null);
  const [vehicleDetailsLead, setVehicleDetailsLead] = useState<ApiLead | null>(null);
  const [convertingCustomer, setConvertingCustomer] = useState<Customer | undefined>(undefined);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const router = useRouter();
  
  // Selection state
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Mounted state to prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

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
      'New': 'NEW',
      'Contacted': 'CONTACTED',
      'Qualified': 'QUOTED', // Map 'Qualified' tab to 'QUOTED' status
      'Converted': 'CONVERTED',
      'Rejected': 'REJECTED'
    };
    return tab === 'All' ? undefined : statusMap[tab];
  };

  // Map sort key to API sortBy
  const getApiSortBy = (key: SortKey): 'fullName' | 'phone' | 'email' | 'status' | 'createdAt' | 'updatedAt' => {
    const sortMap: Record<SortKey, 'fullName' | 'phone' | 'email' | 'status' | 'createdAt' | 'updatedAt'> = {
      'fullName': 'fullName',
      'createdAt': 'createdAt',
      'status': 'status'
    };
    return sortMap[key] || 'createdAt';
  };

  // Get available vehicle conditions - memoized for performance
  const scrapOptions = useMemo(() => ['ALL', 'JUNK', 'DAMAGED', 'WRECKED', 'ACCIDENTAL', 'FULLY_SCRAP'], []);
  
  // Memoize condition filter value to prevent unnecessary re-renders
  const conditionFilterValue = useMemo(() => scrapFilter !== 'ALL' ? scrapFilter : undefined, [scrapFilter]);
  
  // Memoize query parameters for better performance
  const queryParams = useMemo(() => {
    const status = getStatusFromTab(activeTab);
    const sortBy = getApiSortBy(sortKey);
    return {
      page: currentPage,
      limit: rowsPerPage,
      search: debouncedSearchTerm || undefined,
      status: status as any,
      vehicleCondition: conditionFilterValue,
      sortBy,
      sortOrder: sortDir,
    };
  }, [currentPage, rowsPerPage, debouncedSearchTerm, activeTab, conditionFilterValue, sortKey, sortDir]);

  // API hooks with server-side pagination, filtering, and sorting - optimized with memoized params
  const { data: leadsData, isLoading, error } = useLeads(queryParams);
  const deleteLeadMutation = useDeleteLead();
  const updateLeadMutation = useUpdateLead();

  // Fetch and sync lead stats to Zustand store
  useLeadStats();
  
  // Get stats from Zustand store
  const stats = useLeadStatsStore((state) => state.stats);

  // Handle the actual API response structure
  const apiResponse = leadsData as unknown as ApiResponse;
  const leads = useMemo(() => apiResponse?.data?.leads || [], [apiResponse]);
  const pagination = useMemo(() => apiResponse?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  }, [apiResponse]);
  
  const totalLeads = pagination.total;

  // Map stats to tab counts
  const getTabCount = (tab: string): number => {
    if (!stats) return 0;
    switch (tab) {
      case 'All':
        return stats.total;
      case 'New':
        return stats.new;
      case 'Contacted':
        return stats.contacted;
      case 'Qualified':
        return stats.quoted; // Backend uses 'quoted', frontend uses 'Qualified'
      case 'Converted':
        return stats.converted;
      case 'Rejected':
        return stats.rejected;
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
        queryKey: queryKeys.leads.list(nextPageParams),
        queryFn: () => leadsApi.getLeads(nextPageParams),
        staleTime: 3 * 60 * 1000,
      });
    }
  }, [currentPage, pagination.totalPages, queryClient, organizationId, queryParams]);

  const handleDeleteLead = async (id: string) => {
    if (confirm('Delete this lead?')) {
      try {
        await deleteLeadMutation.mutateAsync(id);
        toast.success('Lead deleted');
      } catch (error) {
        console.error('Error deleting lead:', error);
        toast.error('Failed to delete lead');
      }
    }
  };

  const handleConvertToCustomer = (lead: ApiLead) => {
    // Create customer object with pre-filled data from lead
    // Note: id is intentionally omitted/empty to ensure POST API is used
    const convertedCustomer: Customer = {
      id: '', // Empty ID ensures POST (create) API is used, not PUT (update)
      organizationId: lead.organizationId,
      name: lead.fullName || '',
      phone: lead.phone || '',
      email: lead.email,
      address: lead.locationAddress,
      latitude: lead.latitude,
      longitude: lead.longitude,
      vehicleType: lead.vehicleType as any,
      vehicleMake: lead.vehicleMake,
      vehicleModel: lead.vehicleModel,
      vehicleYear: lead.vehicleYear,
      vehicleCondition: lead.vehicleCondition as any,
      accountStatus: 'ACTIVE' as CustomerStatus,
      joinedDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConvertingCustomer(convertedCustomer);
    setIsCustomerFormOpen(true);
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
      setSelectedLeads(new Set(leads.map(lead => lead.id)));
    } else {
      setSelectedLeads(new Set());
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    const newSelected = new Set(selectedLeads);
    if (checked) {
      newSelected.add(leadId);
    } else {
      newSelected.delete(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const isAllSelected = leads.length > 0 && selectedLeads.size === leads.length;
  const isIndeterminate = selectedLeads.size > 0 && selectedLeads.size < leads.length;

  // Handle export
  const handleExport = () => {
    if (selectedLeads.size === 0) {
      toast.info('Please select leads to export');
      return;
    }
    toast.success(`Exporting ${selectedLeads.size} leads...`);
    // TODO: Implement export functionality
  };

  const onInlineStatusChange = async (lead: ApiLead, value: string) => {
    try {
      // Validate status value
      const validStatuses = ['NEW', 'CONTACTED', 'QUOTED', 'CONVERTED', 'REJECTED'];
      if (!validStatuses.includes(value.toUpperCase())) {
        toast.error(`Invalid status: ${value}`);
        return;
      }

      const normalizedStatus = value.toUpperCase() as 'NEW' | 'CONTACTED' | 'QUOTED' | 'CONVERTED' | 'REJECTED';
      
      // Don't update if status hasn't changed
      if (lead.status.toUpperCase() === normalizedStatus) {
        return;
      }

      await updateLeadMutation.mutateAsync({ 
        id: String(lead.id), 
        data: { status: normalizedStatus } 
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
          <h2 className="text-xl font-semibold text-red-600">Error loading leads</h2>
          <p className="text-gray-600 mt-2">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
     

      {/* Tabs - Now moved inside the table */}

      {/* Leads List Card */}
      <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <CardHeader className="pb-4">
          {/* Header and Controls on Same Line */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Title on Left */}
            <CardTitle className="text-xl font-bold text-gray-900">Leads</CardTitle>

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
                title="Add Lead"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Condition Filter - Only shown when filter icon is clicked */}
          {isFilterOpen && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Condition:</Label>
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
              <span className="ml-2 text-gray-600">Loading leads...</span>
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
                            {(['All','New','Contacted','Qualified','Converted','Rejected'] as const).map((tab) => {
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
                        <button className="inline-flex items-center gap-1 hover:text-cyan-600 transition-colors" onClick={() => toggleSort('fullName')}>
                          Lead 
                        </button>
                      </TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-cyan-600 transition-colors" onClick={() => toggleSort('status')}>
                          Status 
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1 hover:text-cyan-600 transition-colors" onClick={() => toggleSort('createdAt')}>
                          Lead Date 
                        </button>
                      </TableHead>
                      <TableHead className="w-12">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <NoDataAnimation />
                        </TableCell>
                      </TableRow>
                    ) : (
                      leads.map((lead) => {
                      const leadPhotos = lead.photos || [];
                      const firstPhoto = leadPhotos.length > 0 ? getImageUrl(leadPhotos[0]) : null;
                                const convertedLead: Lead = {
                                  id: lead.id,
                                  organizationId: lead.organizationId,
                                  fullName: lead.fullName || '',
                                  phone: lead.phone || '',
                                  email: lead.email,
                                  vehicleType: lead.vehicleType as any,
                                  vehicleMake: lead.vehicleMake,
                                  vehicleModel: lead.vehicleModel,
                                  vehicleYear: lead.vehicleYear,
                                  vehicleCondition: lead.vehicleCondition as any,
                                  locationAddress: lead.locationAddress,
                                  latitude: lead.latitude,
                                  longitude: lead.longitude,
                                  leadSource: lead.leadSource as any,
                                  photos: lead.photos,
                                  notes: lead.notes,
                                  status: lead.status as any,
                                  customerId: lead.customerId,
                                  createdAt: new Date(lead.createdAt),
                                  updatedAt: new Date(lead.updatedAt),
                                };
                      
                      return (
                        <TableRow 
                          key={lead.id} 
                          className="border-b hover:bg-gray-50 transition-colors bg-white"
                            >
                          <TableCell>
                            <Checkbox
                              checked={selectedLeads.has(lead.id)}
                              onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                              onClick={(e) => e.stopPropagation()}
                              className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <LeadAvatar 
                                name={lead.fullName || 'N/A'} 
                                imageUrl={firstPhoto}
                                size="md"
                              />
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{lead.fullName || 'N/A'}</span>
                                {lead.email && (
                                  <span className="text-sm text-gray-500">{lead.email}</span>
                              )}
                              </div>
                          </div>
                        </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-gray-900">{lead.phone || 'N/A'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {(lead.vehicleType || lead.vehicleMake || lead.vehicleModel || lead.vehicleYear || lead.vehicleCondition) ? (
                              <Button
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setVehicleDetailsLead(lead);
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
                              <Select value={lead.status} onValueChange={(v) => onInlineStatusChange(lead, v)}>
                                <SelectTrigger className="h-auto w-auto p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none max-w-none min-w-0 overflow-visible">
                                  <div className="flex items-center">
                                    <StatusBadge status={lead.status} showDropdownIcon={true} />
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="min-w-[160px] rounded-lg shadow-lg border border-gray-200 bg-white p-1">
                                  {['NEW','CONTACTED','QUOTED','CONVERTED','REJECTED'].map((s) => {
                                    const isSelected = lead.status.toUpperCase() === s;
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
                            {formatDateHuman(lead.createdAt)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4 text-gray-600" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => setDetailsLead(lead)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setEditingLead(convertedLead);
                                  setIsFormOpen(true);
                                }}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleConvertToCustomer(lead)}
                                  className="text-cyan-600 focus:text-cyan-600"
                                >
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Convert Customer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteLead(lead.id)}
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
                {leads.length === 0 ? (
                  <div className="py-8">
                    <NoDataAnimation />
                  </div>
                ) : (
                  leads.map((lead) => {
                  const leadPhotos = lead.photos || [];
                  const firstPhoto = leadPhotos.length > 0 ? getImageUrl(leadPhotos[0]) : null;
                  return (
                  <div key={lead.id} className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:bg-gradient-to-br hover:from-cyan-50 hover:to-purple-50 cursor-pointer" onClick={() => setDetailsLead(lead)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <LeadAvatar 
                          name={lead.fullName || 'N/A'} 
                          imageUrl={firstPhoto}
                          size="md"
                        />
                      <div>
                        <div className="font-semibold">{lead.fullName || 'N/A'}</div>
                        {lead.email && <div className="text-sm text-muted-foreground">{lead.email}</div>}
                        </div>
                      </div>
                      <StatusBadge status={lead.status} />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Phone</div>
                      <div>{lead.phone || 'N/A'}</div>
                      <div className="text-muted-foreground">Vehicle</div>
                      <div>
                        {(lead.vehicleType || lead.vehicleMake || lead.vehicleModel || lead.vehicleYear || lead.vehicleCondition) ? (
                          <Button
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setVehicleDetailsLead(lead);
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
                      <div>{formatDateHuman(lead.createdAt)}</div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setDetailsLead(lead)} 
                        className="bg-cyan-50/50 hover:bg-cyan-100 text-cyan-600 hover:text-cyan-700 transition-all duration-200 border border-cyan-200/50 hover:border-cyan-300 shadow-sm hover:shadow-md z-10 relative"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                        const convertedLead: Lead = {
                          id: lead.id,
                          organizationId: lead.organizationId,
                          fullName: lead.fullName || '',
                          phone: lead.phone || '',
                          email: lead.email,
                          vehicleType: lead.vehicleType as any,
                          vehicleMake: lead.vehicleMake,
                          vehicleModel: lead.vehicleModel,
                          vehicleYear: lead.vehicleYear,
                          vehicleCondition: lead.vehicleCondition as any,
                          locationAddress: lead.locationAddress,
                          latitude: lead.latitude,
                          longitude: lead.longitude,
                          leadSource: lead.leadSource as any,
                          photos: lead.photos,
                          notes: lead.notes,
                          status: lead.status as any,
                          customerId: lead.customerId,
                          createdAt: new Date(lead.createdAt),
                          updatedAt: new Date(lead.updatedAt),
                        };
                        setEditingLead(convertedLead);
                        setIsFormOpen(true);
                      }} 
                        className="bg-cyan-50/50 hover:bg-cyan-100 text-cyan-600 hover:text-cyan-700 transition-all duration-200 border border-cyan-200/50 hover:border-cyan-300 shadow-sm hover:shadow-md z-10 relative"
                        title="Edit Lead"
                      >
                        <Edit2 className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleConvertToCustomer(lead)} 
                        className="bg-green-50/50 hover:bg-green-100 text-green-600 hover:text-green-700 transition-all duration-200 border border-green-200/50 hover:border-green-300 shadow-sm hover:shadow-md z-10 relative"
                        title="Convert to Customer"
                      >
                        <UserPlus className="h-4 w-4 mr-1" /> Convert
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteLead(lead.id)} 
                        className="bg-red-50/50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all duration-200 border border-red-200/50 hover:border-red-300 shadow-sm hover:shadow-md z-10 relative"
                        title="Delete Lead"
                        disabled={deleteLeadMutation.isPending}
                      >
                        {deleteLeadMutation.isPending ? (
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
                Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalLeads)} of {totalLeads} leads
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
        <Plus className="mr-2 h-4 w-4" /> Add Lead
      </Button>

      {/* Quick View Dialog */}
      <Dialog open={!!detailsLead} onOpenChange={(open) => !open && setDetailsLead(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-bold text-gray-900">Lead Details</DialogTitle>
            <div className="flex items-center gap-2">
              {detailsLead && (
                <Button 
                  onClick={() => {
                    const convertedLead: Lead = {
                      id: detailsLead.id,
                      organizationId: detailsLead.organizationId,
                      fullName: detailsLead.fullName || '',
                      phone: detailsLead.phone || '',
                      email: detailsLead.email,
                      vehicleType: detailsLead.vehicleType as any,
                      vehicleMake: detailsLead.vehicleMake,
                      vehicleModel: detailsLead.vehicleModel,
                      vehicleYear: detailsLead.vehicleYear,
                      vehicleCondition: detailsLead.vehicleCondition as any,
                      locationAddress: detailsLead.locationAddress,
                      latitude: detailsLead.latitude,
                      longitude: detailsLead.longitude,
                      leadSource: detailsLead.leadSource as any,
                      photos: detailsLead.photos,
                      notes: detailsLead.notes,
                      status: detailsLead.status as any,
                      customerId: detailsLead.customerId,
                      createdAt: new Date(detailsLead.createdAt),
                      updatedAt: new Date(detailsLead.updatedAt),
                    };
                    setEditingLead(convertedLead);
                    setIsFormOpen(true);
                    setDetailsLead(null);
                  }}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white h-10 px-4"
                >
                  <Edit2 className="h-4 w-4 mr-2" /> Edit
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => setDetailsLead(null)}
                className="h-10 px-4 border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-red-600 font-medium transition-all"
              >
                Cancel
              </Button>
            </div>
          </DialogHeader>
          {detailsLead && (
            <div className="space-y-4">
              {/* Lead Header with Avatar */}
              <div className="flex items-center gap-4">
                <LeadAvatar 
                  name={detailsLead.fullName || 'N/A'} 
                  imageUrl={detailsLead.photos && detailsLead.photos.length > 0 ? getImageUrl(detailsLead.photos[0]) : null}
                  size="lg"
                />
                <div>
              <div className="text-xl font-bold text-gray-900">{detailsLead.fullName || 'N/A'}</div>
                  {detailsLead.email && (
                    <div className="text-sm text-gray-600 mt-1">{detailsLead.email}</div>
                  )}
                </div>
              </div>
              
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contact Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-muted-foreground">Phone</div>
                  <div className="font-medium">{detailsLead.phone || 'N/A'}</div>
                  {detailsLead.email && (
                    <>
                      <div className="text-muted-foreground">Email</div>
                      <div className="font-medium">{detailsLead.email}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Location Information */}
              {(detailsLead.locationAddress || detailsLead.latitude || detailsLead.longitude) && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Location Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {detailsLead.locationAddress && (
                      <>
                        <div className="text-muted-foreground">Address</div>
                        <div className="font-medium break-words">{detailsLead.locationAddress}</div>
                      </>
                    )}
                    {(detailsLead.latitude !== undefined && detailsLead.latitude !== null) && (
                      <>
                        <div className="text-muted-foreground">Latitude</div>
                        <div className="font-medium font-mono text-xs">{detailsLead.latitude.toFixed(6)}</div>
                      </>
                    )}
                    {(detailsLead.longitude !== undefined && detailsLead.longitude !== null) && (
                      <>
                        <div className="text-muted-foreground">Longitude</div>
                        <div className="font-medium font-mono text-xs">{detailsLead.longitude.toFixed(6)}</div>
                      </>
                    )}
                    {(detailsLead.latitude && detailsLead.longitude) && (
                      <>
                        <div className="text-muted-foreground">Map</div>
                        <div>
                          <a
                            href={`https://www.google.com/maps?q=${detailsLead.latitude},${detailsLead.longitude}`}
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
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-muted-foreground">Vehicle Type</div>
                  <div className="font-medium capitalize">{detailsLead.vehicleType || 'N/A'}</div>
                  <div className="text-muted-foreground">Condition</div>
                  <div className="font-medium capitalize">{String(detailsLead.vehicleCondition || '').replace(/_/g, ' ')}</div>
                  {detailsLead.vehicleMake && (
                    <>
                      <div className="text-muted-foreground">Make</div>
                      <div className="font-medium">{detailsLead.vehicleMake}</div>
                    </>
                  )}
                  {detailsLead.vehicleModel && (
                    <>
                      <div className="text-muted-foreground">Model</div>
                      <div className="font-medium">{detailsLead.vehicleModel}</div>
                    </>
                  )}
                  {detailsLead.vehicleYear && (
                    <>
                      <div className="text-muted-foreground">Year</div>
                      <div className="font-medium">{detailsLead.vehicleYear}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Vehicle Images */}
              {detailsLead.photos && detailsLead.photos.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Vehicle Images</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {detailsLead.photos.map((photo, index) => {
                      const imageUrl = getImageUrl(photo);
                      return (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg border overflow-hidden bg-muted">
                            <img
                              src={imageUrl}
                              alt={`Vehicle image ${index + 1}`}
                              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                              onClick={() => window.open(imageUrl, '_blank')}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">Click to view</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">Click on any image to view in full size</p>
                </div>
              )}

              {/* Internal Notes */}
              {detailsLead.notes && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Internal Notes</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailsLead.notes}</p>
                  </div>
                </div>
              )}

              {/* Status and Metadata */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Status & Metadata</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-muted-foreground">Status</div>
                  <div><StatusBadge status={detailsLead.status} /></div>
                  <div className="text-muted-foreground">Created</div>
                  <div className="font-medium">{formatDateHuman(detailsLead.createdAt)}</div>
                  {detailsLead.leadSource && (
                    <>
                      <div className="text-muted-foreground">Source</div>
                      <div className="font-medium capitalize">{String(detailsLead.leadSource).replace(/_/g, ' ')}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Vehicle Details Dialog */}
      <Dialog open={!!vehicleDetailsLead} onOpenChange={(open) => !open && setVehicleDetailsLead(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-200">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Car className="h-5 w-5 text-cyan-600" />
              Vehicle Details
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setVehicleDetailsLead(null)}
                className="h-10 px-4 border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-red-600 font-medium transition-all"
              >
                Close
              </Button>
            </div>
          </DialogHeader>

          {vehicleDetailsLead && (
            <div className="space-y-6">
              {/* Lead Info Header */}
              <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                <LeadAvatar 
                  name={vehicleDetailsLead.fullName || 'N/A'} 
                  imageUrl={vehicleDetailsLead.photos && vehicleDetailsLead.photos.length > 0 ? getImageUrl(vehicleDetailsLead.photos[0]) : null}
                  size="md"
                />
                <div>
                  <div className="text-lg font-bold text-gray-900">{vehicleDetailsLead.fullName || 'N/A'}</div>
                  {vehicleDetailsLead.email && (
                    <div className="text-sm text-gray-600 mt-1">{vehicleDetailsLead.email}</div>
                  )}
                </div>
              </div>

              {/* Vehicle Information */}
              {(vehicleDetailsLead.vehicleType || vehicleDetailsLead.vehicleMake || vehicleDetailsLead.vehicleModel || vehicleDetailsLead.vehicleYear || vehicleDetailsLead.vehicleCondition) ? (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                      Vehicle Information
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {vehicleDetailsLead.vehicleType && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Vehicle Type</span>
                          <span className="px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-md text-sm font-medium capitalize">{vehicleDetailsLead.vehicleType}</span>
                        </div>
                      )}
                      {vehicleDetailsLead.vehicleMake && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Vehicle Make</span>
                          <span className="text-sm font-medium text-gray-900">{vehicleDetailsLead.vehicleMake}</span>
                        </div>
                      )}
                      {vehicleDetailsLead.vehicleModel && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Vehicle Model</span>
                          <span className="text-sm font-medium text-gray-900">{vehicleDetailsLead.vehicleModel}</span>
                        </div>
                      )}
                      {vehicleDetailsLead.vehicleYear && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Vehicle Year</span>
                          <span className="text-sm font-medium text-gray-900">{vehicleDetailsLead.vehicleYear}</span>
                        </div>
                      )}
                      {vehicleDetailsLead.vehicleCondition && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Vehicle Condition</span>
                          <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-md text-sm font-medium capitalize">{String(vehicleDetailsLead.vehicleCondition).replace(/_/g, ' ')}</span>
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

      <LeadForm
        lead={editingLead}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingLead(undefined);
        }}
      />

      <CustomerForm
        customer={convertingCustomer}
        isOpen={isCustomerFormOpen}
        isConverting={true}
        onClose={() => {
          setIsCustomerFormOpen(false);
          setConvertingCustomer(undefined);
        }}
        onSuccess={(createdCustomer) => {
          // Navigate to customers page with highlight parameter
          router.push(`/customers?highlight=${createdCustomer.id}`);
          toast.success(`Customer "${createdCustomer.name}" converted successfully!`);
        }}
      />
    </div>
  );
}