'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useVehicleTypes, useDeleteVehicleType, useUpdateVehicleType, useVehicleTypeStats } from '@/hooks/use-vehicle-types';
import { useVehicleTypeStore } from '@/lib/store/vehicle-type-store';
import { VehicleType } from '@/lib/api/vehicleTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VehicleTypeForm } from '@/components/vehicle-type-form';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, Loader2, CheckCircle2, ChevronDown, ArrowUpDown, MoreHorizontal, Filter, X, Car, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { useAuthStore } from '@/lib/store/auth-store';
import { vehicleTypesApi } from '@/lib/api/vehicleTypes';

// Dynamically import Lottie for better performance
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// No Data Animation Component
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
        <div className="text-gray-400 text-sm">No vehicle types found</div>
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
      <p className="mt-4 text-gray-600 text-sm font-medium">No vehicle types found</p>
      <p className="mt-1 text-gray-400 text-xs">Try adjusting your filters or create a new one</p>
    </div>
  );
}

// Sortable Header Component
function SortableHeader({
  label,
  sortKey,
  currentSortKey,
  currentSortDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSortKey: SortKey;
  currentSortDir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
}) {
  const isActive = currentSortKey === sortKey;

  return (
    <button
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 hover:text-cyan-600 transition-colors"
    >
      {label}
      <ArrowUpDown className={cn(
        "h-4 w-4 transition-all",
        isActive ? "text-cyan-600" : "text-gray-400"
      )} />
    </button>
  );
}

// Tab color styles
type TabKey = 'All' | 'Active' | 'Inactive';
function getTabStyle(tab: TabKey) {
  switch (tab) {
    case 'All':
      return { activeText: 'text-cyan-700', activeBg: 'bg-cyan-50', underline: 'bg-cyan-500', count: 'bg-cyan-100 text-cyan-700' };
    case 'Active':
      return { activeText: 'text-green-700', activeBg: 'bg-green-50', underline: 'bg-green-600', count: 'bg-green-100 text-green-700' };
    case 'Inactive':
      return { activeText: 'text-gray-700', activeBg: 'bg-gray-50', underline: 'bg-gray-600', count: 'bg-gray-100 text-gray-700' };
    default:
      return { activeText: 'text-primary', activeBg: 'bg-muted', underline: 'bg-primary', count: 'bg-muted text-foreground' };
  }
}

function StatusBadge({ isActive, showDropdownIcon = false }: { isActive: boolean; showDropdownIcon?: boolean }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 whitespace-nowrap">
        <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
        <span className="whitespace-nowrap">Active</span>
        {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 whitespace-nowrap">
      <Shield className="h-3 w-3 flex-shrink-0" />
      <span className="whitespace-nowrap">Inactive</span>
      {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
    </span>
  );
}

type SortKey = 'name' | 'isActive' | 'createdAt' | 'updatedAt';

interface ApiResponse {
  data: {
    vehicleTypes: VehicleType[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export default function VehicleTypesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const organizationId = user?.organizationId;

  // Prevent hydration errors
  const [mounted, setMounted] = useState(false);

  // Use Zustand Store
  const {
    filters,
    setSearch,
    setPage,
    setLimit,
    setIsActiveFilter,
    setSortBy,
    setSortOrder,
    resetFilters
  } = useVehicleTypeStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicleType, setEditingVehicleType] = useState<VehicleType | undefined>();
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());

  // Debounce search - initialize with empty string to prevent hydration mismatch
  const [localSearch, setLocalSearch] = useState('');

  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true);
    // Sync localSearch with store after mount
    setLocalSearch(filters.search);
  }, []);

  useEffect(() => {
    if (!mounted) return; // Don't run until mounted
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        setSearch(localSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, filters.search, setSearch, mounted]);

  // Derived active tab from filters.isActive
  const activeTab = useMemo(() => {
    if (!mounted) return 'All'; // Default during SSR
    if (filters.isActive === true) return 'Active';
    if (filters.isActive === false) return 'Inactive';
    return 'All';
  }, [filters.isActive, mounted]) as TabKey;

  // Data fetching
  // Map store 'isActive' to hook 'status'
  const queryParams = useMemo(() => ({
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    status: filters.isActive,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  }), [filters]);

  const { data: vehicleTypesData, isLoading, error } = useVehicleTypes(queryParams);
  const { data: statsData } = useVehicleTypeStats();

  const deleteVehicleTypeMutation = useDeleteVehicleType();
  const updateVehicleTypeMutation = useUpdateVehicleType();

  // Extract data
  const apiResponse = vehicleTypesData as unknown as ApiResponse<any>; // Cast to match API
  const vehicleTypes = useMemo(() => apiResponse?.data?.vehicleTypes || [], [apiResponse]);
  const pagination = useMemo(() => apiResponse?.data?.pagination || {
    page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false
  }, [apiResponse]);

  const stats = statsData || { total: 0, active: 0, inactive: 0 };

  // Handlers
  const handleTabChange = (tab: TabKey) => {
    if (tab === 'Active') setIsActiveFilter(true);
    else if (tab === 'Inactive') setIsActiveFilter(false);
    else setIsActiveFilter(null);
  };

  const handleCreate = () => {
    setEditingVehicleType(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (vehicleType: VehicleType) => {
    setEditingVehicleType(vehicleType);
    setIsFormOpen(true);
  };

  const handleStatusChange = async (vehicleType: VehicleType, newStatus: boolean) => {
    try {
      if (vehicleType.isActive === newStatus) return;

      await updateVehicleTypeMutation.mutateAsync({
        id: vehicleType.id.toString(),
        data: { isActive: newStatus }
      });
      // Optimistic update handles UI, no loading spinner
      toast.success(`Vehicle type ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update vehicle type status');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this vehicle type?')) {
      try {
        await deleteVehicleTypeMutation.mutateAsync(id);
        toast.success('Vehicle type deleted successfully');
      } catch (error) {
        toast.error('Failed to delete vehicle type');
      }
    }
  };

  const toggleSort = (key: SortKey) => {
    if (filters.sortBy === key) {
      setSortOrder(filters.sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  // Selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTypes(new Set(vehicleTypes.map(v => v.id.toString())));
    } else {
      setSelectedTypes(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedTypes);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedTypes(newSelected);
  };

  const isAllSelected = vehicleTypes.length > 0 && selectedTypes.size === vehicleTypes.length;

  const getTabCount = (tab: TabKey) => {
    switch (tab) {
      case 'All': return stats.total;
      case 'Active': return stats.active;
      case 'Inactive': return stats.inactive;
      default: return 0;
    }
  };

  // Prefetching
  useEffect(() => {
    if (filters.page < pagination.totalPages && organizationId) {
      const nextPageParams = { ...queryParams, page: filters.page + 1, organizationId };
      queryClient.prefetchQuery({
        queryKey: queryKeys.vehicleTypes.list(nextPageParams),
        queryFn: () => vehicleTypesApi.getVehicleTypes({ ...nextPageParams, isActive: nextPageParams.status !== null ? nextPageParams.status : undefined }),
        staleTime: 3 * 60 * 1000,
      });
    }
  }, [filters.page, pagination.totalPages, queryClient, organizationId, queryParams]);

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600">Error loading vehicle types</h2>
        <Button onClick={() => window.location.reload()} className="mt-4">Retry</Button>
      </div>
    );
  }

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-xl font-bold text-gray-900">Vehicle Types</CardTitle>

            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-[300px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vehicle types..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all duration-200"
                />
              </div>

              <Button
                onClick={handleCreate}
                className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 w-9 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto hidden sm:block">
                <Table>
                  <TableHeader className="bg-white">
                    <TableRow className="hover:bg-transparent border-b-2 border-gray-200 bg-gray-50">
                      <TableHead colSpan={5} className="p-0 bg-transparent">
                        <div className="flex items-center gap-1 px-2 py-2">
                          {(['All', 'Active', 'Inactive'] as TabKey[]).map((tab) => {
                            const style = getTabStyle(tab);
                            const isActive = activeTab === tab;
                            return (
                              <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`relative px-4 py-2 text-sm font-medium transition-all rounded-t-md ${isActive ? `${style.activeText} ${style.activeBg}` : 'text-gray-600 hover:bg-gray-100'}`}
                              >
                                <span className="inline-flex items-center gap-2">
                                  {tab}
                                  <span className={`text-xs rounded-full px-2 py-0.5 ${style.count}`}>
                                    {getTabCount(tab)}
                                  </span>
                                </span>
                                {isActive && <span className={`absolute left-0 right-0 -bottom-0.5 h-0.5 ${style.underline}`} />}
                              </button>
                            );
                          })}
                        </div>
                      </TableHead>
                    </TableRow>

                    <TableRow className="hover:bg-transparent border-b bg-white">
                      <TableHead className="w-12">
                        <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
                      </TableHead>
                      <TableHead className="w-[400px]">
                        <SortableHeader
                          label="Name"
                          sortKey="name"
                          currentSortKey={filters.sortBy}
                          currentSortDir={filters.sortOrder}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead className="w-[150px]">
                        <SortableHeader
                          label="Status"
                          sortKey="isActive"
                          currentSortKey={filters.sortBy}
                          currentSortDir={filters.sortOrder}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead className="w-[200px]">
                        <SortableHeader
                          label="Created Date"
                          sortKey="createdAt"
                          currentSortKey={filters.sortBy}
                          currentSortDir={filters.sortOrder}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleTypes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}><NoDataAnimation /></TableCell>
                      </TableRow>
                    ) : (
                      vehicleTypes.map((vehicleType) => (
                        <TableRow key={vehicleType.id} className="cursor-pointer hover:bg-gray-50">
                          <TableCell>
                            <Checkbox
                              checked={selectedTypes.has(vehicleType.id.toString())}
                              onCheckedChange={(c) => handleSelectOne(vehicleType.id.toString(), c as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">{vehicleType.name}</TableCell>

                          <TableCell>
                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                              <label className="custom-toggle-switch scale-75">
                                <input
                                  type="checkbox"
                                  className="chk"
                                  checked={vehicleType.isActive}
                                  onChange={(e) => handleStatusChange(vehicleType, e.target.checked)}
                                />
                                <span className="slider"></span>
                              </label>
                              <span className={`text-sm font-medium ${vehicleType.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                                {vehicleType.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-500">{new Date(vehicleType.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(vehicleType)}>
                                  <Edit2 className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(vehicleType.id.toString())}>
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View - Cards */}
              <div className="sm:hidden grid gap-4">
                {vehicleTypes.map((vehicleType) => (
                  <Card key={vehicleType.id}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="font-semibold">{vehicleType.name}</div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <StatusBadge isActive={vehicleType.isActive} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                        <span>{new Date(vehicleType.createdAt).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(vehicleType)}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(vehicleType.id.toString())} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <RowsPerPage value={filters.limit} onChange={setLimit} options={[5, 10, 20, 50]} />
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <VehicleTypeForm
        vehicleType={editingVehicleType}
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingVehicleType(undefined); }}
      />
    </div >
  );
}
