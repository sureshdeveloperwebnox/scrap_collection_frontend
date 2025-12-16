'use client';

import { useState, useEffect, useMemo } from 'react';
import { useVehicleTypes } from '@/hooks/use-vehicle-types';
import { useScrapYards } from '@/hooks/use-scrap-yards';
import { useVehicleNames, useCreateVehicleName, useUpdateVehicleName, useDeleteVehicleName } from '@/hooks/use-vehicle-names';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, Loader2, CheckCircle2, ChevronDown, ArrowUpDown, MoreHorizontal, Filter, X, Car, Building2, Shield } from 'lucide-react';
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

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
      <Shield className="h-3 w-3 flex-shrink-0" />
      Inactive
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

export default function VehicleNamesPage() {
  const { user } = useAuthStore();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('All');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicleName, setEditingVehicleName] = useState<VehicleName | undefined>();
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const statusFilter = useMemo(() => {
    if (activeTab === 'Active') return true;
    if (activeTab === 'Inactive') return false;
    return undefined;
  }, [activeTab]);

  // Data Fetching
  const { data: vehicleNamesData, isLoading, error, refetch } = useVehicleNames({
    page,
    limit,
    search: debouncedSearchTerm || undefined,
    isActive: statusFilter,
  });

  const { data: vehicleTypesData } = useVehicleTypes({ page: 1, limit: 100 });
  const { data: scrapYardsData } = useScrapYards({ page: 1, limit: 100 });

  const createVehicleNameMutation = useCreateVehicleName();
  const updateVehicleNameMutation = useUpdateVehicleName();
  const deleteVehicleNameMutation = useDeleteVehicleName();

  const vehicleTypes = useMemo(() => {
    const apiResponse = vehicleTypesData as any;
    return apiResponse?.data?.vehicleTypes || [];
  }, [vehicleTypesData]) as VehicleType[];

  const scrapYards = useMemo(() => {
    const apiResponse = scrapYardsData as any;
    return apiResponse?.data?.scrapYards || [];
  }, [scrapYardsData]) as ScrapYard[];

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
    scrapYardId: string;
    isActive?: boolean;
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

  const handleToggleStatus = async (vehicleName: VehicleName) => {
    try {
      await updateVehicleNameMutation.mutateAsync({
        id: vehicleName.id,
        data: { isActive: !vehicleName.isActive }
      });
      toast.success(`Vehicle name ${vehicleName.isActive ? 'deactivated' : 'activated'} successfully`);
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                      <TableHead colSpan={7} className="p-0 bg-transparent">
                        <div className="flex items-center gap-1 px-2 py-2">
                          {(['All', 'Active', 'Inactive'] as TabKey[]).map((tab) => {
                            const style = getTabStyle(tab);
                            const isActive = activeTab === tab;
                            return (
                              <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); setPage(1); }}
                                className={`relative px-4 py-2 text-sm font-medium transition-all rounded-t-md ${isActive ? `${style.activeText} ${style.activeBg}` : 'text-gray-600 hover:bg-gray-100'}`}
                              >
                                {tab}
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
                      <TableHead>Scrap Yard</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleNames.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}><NoDataAnimation /></TableCell>
                      </TableRow>
                    ) : (
                      vehicleNames.map((vehicleName) => (
                        <TableRow key={vehicleName.id} className="cursor-pointer hover:bg-gray-50">
                          <TableCell>
                            <Checkbox
                              checked={selectedNames.has(vehicleName.id.toString())}
                              onCheckedChange={(c) => handleSelectOne(vehicleName.id.toString(), c as boolean)}
                            />
                          </TableCell>
                          <TableCell className="font-medium text-gray-900">
                            <div className="flex items-center space-x-2">
                              <Car className="h-4 w-4 text-cyan-600" />
                              <span>{vehicleName.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {vehicleName.vehicleType ? (
                              <Badge variant="outline" className="font-normal">{vehicleName.vehicleType.name}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            {vehicleName.scrapYard ? (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Building2 className="h-3 w-3" />
                                <span>{vehicleName.scrapYard.yardName}</span>
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell><StatusBadge isActive={vehicleName.isActive} /></TableCell>
                          <TableCell className="text-gray-500">{new Date(vehicleName.createdAt).toLocaleDateString()}</TableCell>
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
                      <StatusBadge isActive={vehicleName.isActive} />
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Type:</span>
                          <span>{vehicleName.vehicleType?.name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Yard:</span>
                          <span>{vehicleName.scrapYard?.yardName || '-'}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-2">
                        <span>{new Date(vehicleName.createdAt).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(vehicleName)}><Edit2 className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(vehicleName.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <RowsPerPage value={limit} onChange={(v) => { setLimit(v); setPage(1); }} options={[5, 10, 20, 50]} />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVehicleName ? 'Edit Vehicle Name' : 'Add Vehicle Name'}</DialogTitle>
          </DialogHeader>
          <VehicleNameForm
            vehicleName={editingVehicleName}
            vehicleTypes={vehicleTypes}
            scrapYards={scrapYards}
            onSubmit={handleSubmit}
            onCancel={() => { setIsFormOpen(false); setEditingVehicleName(undefined); }}
            isLoading={createVehicleNameMutation.isPending || updateVehicleNameMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VehicleNameForm({
  vehicleName,
  vehicleTypes,
  scrapYards,
  onSubmit,
  onCancel,
  isLoading,
}: {
  vehicleName?: VehicleName;
  vehicleTypes: VehicleType[];
  scrapYards: ScrapYard[];
  onSubmit: (data: { name: string; vehicleTypeId: number; scrapYardId: string; isActive?: boolean }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [name, setName] = useState(vehicleName?.name || '');
  const [vehicleTypeId, setVehicleTypeId] = useState<string>(vehicleName?.vehicleTypeId.toString() || '');
  const [scrapYardId, setScrapYardId] = useState(vehicleName?.scrapYardId || '');
  const [isActive, setIsActive] = useState(vehicleName?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !vehicleTypeId || !scrapYardId) {
      toast.error('Please fill in all required fields');
      return;
    }
    onSubmit({
      name,
      vehicleTypeId: parseInt(vehicleTypeId),
      scrapYardId,
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Vehicle Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Toyota Camry"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vehicleType">Vehicle Type *</Label>
        <Select value={vehicleTypeId} onValueChange={setVehicleTypeId} required disabled={isLoading}>
          <SelectTrigger>
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
        <Label htmlFor="scrapYard">Scrap Yard *</Label>
        <Select value={scrapYardId} onValueChange={setScrapYardId} required disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Select scrap yard" />
          </SelectTrigger>
          <SelectContent>
            {scrapYards.filter(sy => sy.isActive !== false).map((sy) => (
              <SelectItem key={sy.id} value={sy.id}>
                {sy.yardName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={isActive}
          onCheckedChange={(c) => setIsActive(c as boolean)}
          disabled={isLoading}
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-cyan-600 hover:bg-cyan-700">
          {vehicleName ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  );
}
