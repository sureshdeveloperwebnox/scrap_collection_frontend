'use client';

import { useState, useEffect, useMemo } from 'react';
import { useVehicleTypes } from '@/hooks/use-vehicle-types';

import { useVehicleNames, useCreateVehicleName, useUpdateVehicleName, useDeleteVehicleName, useVehicleNameStats } from '@/hooks/use-vehicle-names';
import { VehicleName, VehicleType, ScrapYard } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, Loader2, CheckCircle2, ChevronDown, ArrowUpDown, MoreHorizontal, Filter, X, Car, Building2, Shield, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/lib/store/auth-store';

// Dynamically import Lottie
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
        <div className="text-gray-400 text-sm">No vehicle names found</div>
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
      <p className="mt-4 text-gray-600 text-sm font-medium">No vehicle names found</p>
      <p className="mt-1 text-gray-400 text-xs">Try adjusting your filters or create a new one</p>
    </div>
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

interface ApiResponse {
  data: {
    vehicleNames: VehicleName[];
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

// ... (previous imports)
import { useVehicleNameStore } from '@/lib/store/vehicle-name-store';

// ... (other components)

export default function VehicleNamesPage() {
  const { user } = useAuthStore();

  // Store state
  const {
    filters,
    setSearch,
    setPage,
    setLimit,
    setIsActiveFilter,
    setSortBy,
    setSortOrder
  } = useVehicleNameStore();

  const { data: statsData } = useVehicleNameStats();
  const stats = statsData || { total: 0, active: 0, inactive: 0 };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicleName, setEditingVehicleName] = useState<VehicleName | undefined>();
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());

  // Debounce search handled in store logic or effect? 
  // Store updates directly, but we might want to debounce the API call or the store update.
  // The store currently resets page on search.
  // We can keep local debounceTerm if we want to avoid too many store updates, 
  // OR we can just let the hook handle debouncing of the *query param*.
  // Let's use local debounce for search input -> store search.

  const [localSearch, setLocalSearch] = useState(filters.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        setSearch(localSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, filters.search, setSearch]);

  // Derived active tab from filters.isActive
  const activeTab = useMemo(() => {
    if (filters.isActive === true) return 'Active';
    if (filters.isActive === false) return 'Inactive';
    return 'All';
  }, [filters.isActive]) as TabKey;

  const handleTabChange = (tab: TabKey) => {
    if (tab === 'Active') setIsActiveFilter(true);
    else if (tab === 'Inactive') setIsActiveFilter(false);
    else setIsActiveFilter(undefined);
  };

  // Data Fetching
  const { data: vehicleNamesData, isLoading, error, refetch } = useVehicleNames({
    page: filters.page,
    limit: filters.limit,
    search: filters.search || undefined,
    isActive: filters.isActive,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const { data: vehicleTypesData } = useVehicleTypes({ page: 1, limit: 100 });

  const createVehicleNameMutation = useCreateVehicleName();
  const updateVehicleNameMutation = useUpdateVehicleName();
  const deleteVehicleNameMutation = useDeleteVehicleName();

  const vehicleTypes = useMemo(() => {
    const apiResponse = vehicleTypesData as any;
    return apiResponse?.data?.vehicleTypes || [];
  }, [vehicleTypesData]) as VehicleType[];

  const apiResponse = vehicleNamesData as unknown as ApiResponse;
  const vehicleNames = useMemo(() => apiResponse?.data?.vehicleNames || [], [apiResponse]) as VehicleName[];
  const pagination = useMemo(() => apiResponse?.data?.pagination || {
    page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false
  }, [apiResponse]);

  // Handlers
  const handleCreate = () => {
    setEditingVehicleName(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (vehicleName: VehicleName) => {
    setEditingVehicleName(vehicleName);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this vehicle name?')) {
      try {
        await deleteVehicleNameMutation.mutateAsync(id);
        toast.success('Vehicle name deleted successfully');
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to delete vehicle name');
      }
    }
  };

  const handleSubmit = async (formData: {
    name: string;
    vehicleTypeId: number;
    isActive?: boolean;
    vehicleNumber?: string;
    make?: string;
    model?: string;
    year?: number;
  }) => {
    try {
      if (editingVehicleName) {
        await updateVehicleNameMutation.mutateAsync({
          id: editingVehicleName.id,
          data: formData
        });
        toast.success('Vehicle name updated successfully');
      } else {
        await createVehicleNameMutation.mutateAsync(formData);
        toast.success('Vehicle name created successfully');
      }
      setIsFormOpen(false);
      setEditingVehicleName(undefined);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save vehicle name');
    }
  };

  const handleStatusChange = async (vehicleName: VehicleName, newStatus: boolean) => {
    try {
      if (vehicleName.isActive === newStatus) return;

      await updateVehicleNameMutation.mutateAsync({
        id: vehicleName.id,
        data: { isActive: newStatus }
      });
      // Optimistic update handles the UI, no need for manual toast here technically if we trust the UI, but feedback is good.
      // toast is fine.
      toast.success(`Vehicle name ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update vehicle name status');
    }
  };

  // Selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedNames(new Set(vehicleNames.map(v => v.id.toString())));
    } else {
      setSelectedNames(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedNames);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedNames(newSelected);
  };

  const isAllSelected = vehicleNames.length > 0 && selectedNames.size === vehicleNames.length;

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600">Error loading vehicle names</h2>
        <Button onClick={() => refetch()} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-xl font-bold text-gray-900">Vehicle Names</CardTitle>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 h-9 w-9 p-0"
              >
                <Search className="h-4 w-4" />
              </Button>

              {isSearchOpen && (
                <div className="relative animate-in slide-in-from-right-10 duration-200">
                  <Input
                    placeholder="Search..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-64 pl-10 h-9"
                    autoFocus
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
              )}

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
                      <TableHead colSpan={6} className="p-0 bg-transparent">
                        <div className="flex items-center gap-1 px-2 py-2">
                          {(['All', 'Active', 'Inactive'] as TabKey[]).map((tab) => {
                            const style = getTabStyle(tab);
                            const isActive = activeTab === tab;
                            const count = tab === 'All' ? stats.total : tab === 'Active' ? stats.active : stats.inactive;

                            return (
                              <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`relative px-4 py-2 text-sm font-medium transition-all rounded-t-md flex items-center gap-2 ${isActive ? `${style.activeText} ${style.activeBg}` : 'text-gray-600 hover:bg-gray-100'}`}
                              >
                                {tab}
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${style.count}`}>
                                  {count}
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
                      <TableHead>Vehicle Name</TableHead>
                      <TableHead>Vehicle Type</TableHead>
                      <TableHead>Vehicle Number</TableHead>
                      <TableHead>Make</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Year</TableHead>

                      <TableHead>Status</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleNames.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8}><NoDataAnimation /></TableCell>
                      </TableRow>
                    ) : (
                      vehicleNames.map((vehicleName) => (
                        <TableRow key={vehicleName.id} className="cursor-pointer hover:bg-gray-50">
                          <TableCell>
                            <Checkbox
                              checked={selectedNames.has(vehicleName.id.toString())}
                              onCheckedChange={(c) => handleSelectOne(vehicleName.id.toString(), c as boolean)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">{vehicleName.name}</TableCell>
                          <TableCell className="text-gray-600">{vehicleName.vehicleType?.name || 'N/A'}</TableCell>
                          <TableCell className="text-gray-600">{vehicleName.vehicleNumber || '-'}</TableCell>
                          <TableCell className="text-gray-600">{vehicleName.make || '-'}</TableCell>
                          <TableCell className="text-gray-600">{vehicleName.model || '-'}</TableCell>
                          <TableCell className="text-gray-600">{vehicleName.year || '-'}</TableCell>

                          <TableCell>
                            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                              <label className="custom-toggle-switch scale-75">
                                <input
                                  type="checkbox"
                                  className="chk"
                                  checked={vehicleName.isActive}
                                  onChange={(e) => handleStatusChange(vehicleName, e.target.checked)}
                                />
                                <span className="slider"></span>
                              </label>
                              <span className={`text-sm font-medium ${vehicleName.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                                {vehicleName.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(vehicleName)}>
                                  <Edit2 className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(vehicleName.id)}>
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
                {vehicleNames.map((vehicleName) => (
                  <Card key={vehicleName.id}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="font-semibold flex items-center gap-2">
                        <Car className="h-4 w-4 text-cyan-600" />
                        {vehicleName.name}
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <StatusBadge isActive={vehicleName.isActive} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Type:</span>
                          <span>{vehicleName.vehicleType?.name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Number:</span>
                          <span>{vehicleName.vehicleNumber || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Make/Model:</span>
                          <span>{vehicleName.make || '-'} / {vehicleName.model || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Year:</span>
                          <span>{vehicleName.year || '-'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-auto">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(vehicleName)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(vehicleName.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <RowsPerPage value={filters.limit} onChange={(v) => { setLimit(v); setPage(1); }} options={[5, 10, 20, 50]} />
                  <div className="text-xs text-gray-500 font-medium">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} vehicle names
                  </div>
                </div>
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent
          className="w-[95vw] sm:max-w-[800px] max-h-[95vh] bg-white border-0 shadow-2xl rounded-2xl p-0 flex flex-col [&>button]:hidden"
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
          onPointerDownOutside={(e) => {
            e.preventDefault();
          }}
        >
          <DialogHeader className="px-8 pt-8 pb-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {editingVehicleName ? 'Edit Vehicle Name' : 'Add Vehicle Name'}
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-2">
                  {editingVehicleName ? 'Update vehicle details' : 'Add a new vehicle to the fleet'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsFormOpen(false); setEditingVehicleName(undefined); }}
                  disabled={createVehicleNameMutation.isPending || updateVehicleNameMutation.isPending}
                  className="h-10 px-4 rounded-xl border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-red-600 font-medium transition-all hover:shadow-md"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="vehicle-name-form"
                  disabled={createVehicleNameMutation.isPending || updateVehicleNameMutation.isPending}
                  className="h-10 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
                >
                  {createVehicleNameMutation.isPending || updateVehicleNameMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {editingVehicleName ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingVehicleName ? 'Update' : 'Create'
                  )}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0">
            <VehicleNameForm
              vehicleName={editingVehicleName}
              vehicleTypes={vehicleTypes}
              onSubmit={handleSubmit}
              onCancel={() => { setIsFormOpen(false); setEditingVehicleName(undefined); }}
              isLoading={createVehicleNameMutation.isPending || updateVehicleNameMutation.isPending}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div >
  );
}

function VehicleNameForm({
  vehicleName,
  vehicleTypes,
  onSubmit,
  onCancel,
  isLoading,
}: {
  vehicleName?: VehicleName;
  vehicleTypes: VehicleType[];
  onSubmit: (data: {
    name: string;
    vehicleTypeId: number;
    isActive?: boolean;
    vehicleNumber?: string;
    make?: string;
    model?: string;
    year?: number;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [name, setName] = useState(vehicleName?.name || '');
  const [vehicleTypeId, setVehicleTypeId] = useState<string>(vehicleName?.vehicleTypeId.toString() || '');
  const [isActive, setIsActive] = useState(vehicleName?.isActive ?? true);

  // New fields
  const [vehicleNumber, setVehicleNumber] = useState(vehicleName?.vehicleNumber || '');
  const [make, setMake] = useState(vehicleName?.make || '');
  const [model, setModel] = useState(vehicleName?.model || '');
  const [year, setYear] = useState<string>(vehicleName?.year?.toString() || new Date().getFullYear().toString());

  // Update local state when vehicleName prop changes
  useEffect(() => {
    if (vehicleName) {
      setName(vehicleName.name || '');
      setVehicleTypeId(vehicleName.vehicleTypeId.toString() || '');
      setIsActive(vehicleName.isActive ?? true);
      setVehicleNumber(vehicleName.vehicleNumber || '');
      setMake(vehicleName.make || '');
      setModel(vehicleName.model || '');
      setYear(vehicleName.year?.toString() || new Date().getFullYear().toString());
    } else {
      setName('');
      setVehicleTypeId('');
      setIsActive(true);
      setVehicleNumber('');
      setMake('');
      setModel('');
      setYear(new Date().getFullYear().toString());
    }
  }, [vehicleName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !vehicleTypeId) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSubmit({
      name,
      vehicleTypeId: parseInt(vehicleTypeId),
      isActive,
      vehicleNumber: vehicleNumber || undefined,
      make: make || undefined,
      model: model || undefined,
      year: year ? parseInt(year) : undefined,
    });
  };

  return (
    <form id="vehicle-name-form" onSubmit={handleSubmit} className="px-8 pb-8 space-y-6 pt-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Vehicle Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Toyota Camry"
              required
              disabled={isLoading}
              className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleType" className="text-sm font-medium text-gray-700">Vehicle Type *</Label>
            <Select value={vehicleTypeId} onValueChange={setVehicleTypeId} required disabled={isLoading}>
              <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all">
                <SelectValue placeholder="Select vehicle type" />
              </SelectTrigger>
              <SelectContent>
                {vehicleTypes.filter(vt => vt.isActive).map((vt) => (
                  <SelectItem key={vt.id} value={vt.id.toString()}>
                    {vt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vehicleNumber" className="text-sm font-medium text-gray-700">Vehicle Number</Label>
            <Input
              id="vehicleNumber"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              placeholder="e.g., KA-01-AB-1234"
              disabled={isLoading}
              className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="make" className="text-sm font-medium text-gray-700">Make</Label>
              <Input
                id="make"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g., Toyota"
                disabled={isLoading}
                className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model" className="text-sm font-medium text-gray-700">Model</Label>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g., Camry"
                disabled={isLoading}
                className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year" className="text-sm font-medium text-gray-700">Year</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="YYYY"
                disabled={isLoading}
                className="pl-10 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 mt-2">
            <div className="space-y-0.5">
              <Label htmlFor="isActive" className="text-base font-medium text-gray-900">Active Status</Label>
              <p className="text-sm text-gray-500">Enable or disable this vehicle</p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked: boolean) => setIsActive(checked)}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
