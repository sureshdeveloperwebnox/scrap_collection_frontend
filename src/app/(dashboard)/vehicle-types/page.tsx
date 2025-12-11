'use client';

import { useState, useEffect, useMemo } from 'react';
import { useVehicleTypes, useDeleteVehicleType, useUpdateVehicleType, useVehicleTypeStats } from '@/hooks/use-vehicle-types';
import { useVehicleTypeStore } from '@/lib/store/vehicle-type-store';
import { VehicleType } from '@/lib/api/vehicleTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VehicleTypeForm } from '@/components/vehicle-type-form';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

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
  // Zustand store
  const filters = useVehicleTypeStore((state) => state.filters);
  const setSearch = useVehicleTypeStore((state) => state.setSearch);
  const setIsActiveFilter = useVehicleTypeStore((state) => state.setIsActiveFilter);
  const setPage = useVehicleTypeStore((state) => state.setPage);
  const setLimit = useVehicleTypeStore((state) => state.setLimit);
  const setSortBy = useVehicleTypeStore((state) => state.setSortBy);
  const setSortOrder = useVehicleTypeStore((state) => state.setSortOrder);

  // Local state
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(filters.search);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicleType, setEditingVehicleType] = useState<VehicleType | undefined>();
  const [detailsVehicleType, setDetailsVehicleType] = useState<VehicleType | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, setSearch]);

  // Fetch vehicle types
  const { data: vehicleTypesData, isLoading, error, refetch } = useVehicleTypes({
    page: filters.page,
    limit: filters.limit,
    search: debouncedSearchTerm || undefined,
    status: filters.isActive,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  // Fetch stats
  const { data: stats } = useVehicleTypeStats();

  // Mutations
  const deleteVehicleTypeMutation = useDeleteVehicleType();
  const updateVehicleTypeMutation = useUpdateVehicleType();

  // Handle API response structure
  const apiResponse = vehicleTypesData as unknown as ApiResponse;
  const vehicleTypes = useMemo(() => apiResponse?.data?.vehicleTypes || [], [apiResponse]);
  const pagination = useMemo(() => apiResponse?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  }, [apiResponse]);

  const handleCreate = () => {
    setEditingVehicleType(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (vehicleType: VehicleType) => {
    setEditingVehicleType(vehicleType);
    setIsFormOpen(true);
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

  const handleToggleStatus = async (vehicleType: VehicleType) => {
    try {
      await updateVehicleTypeMutation.mutateAsync({
        id: vehicleType.id.toString(),
        data: { isActive: !vehicleType.isActive }
      });
      toast.success(`Vehicle type ${vehicleType.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      toast.error('Failed to update vehicle type status');
    }
  };

  const handleSort = (key: SortKey) => {
    if (filters.sortBy === key) {
      setSortOrder(filters.sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (filters.sortBy !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return filters.sortOrder === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading vehicle types</h2>
          <p className="text-gray-600 mt-2">Please try again later.</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur z-10 py-2">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Types</h1>
          <p className="text-gray-600 mt-1">
            {isLoading ? 'Loading...' : `${stats?.total ?? pagination.total} Total Vehicle Types`}
            {stats && (
              <span className="ml-4 text-sm">
                ({stats.active} Active, {stats.inactive} Inactive)
              </span>
            )}
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle Type
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.isActive === null ? 'all' : filters.isActive ? 'active' : 'inactive'}
              onValueChange={(value) => {
                setIsActiveFilter(value === 'all' ? null : value === 'active');
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Types</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : vehicleTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No vehicle types found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center hover:text-primary"
                        >
                          Name {getSortIcon('name')}
                        </button>
                      </th>
                      <th className="text-left p-4">Icon</th>
                      <th className="text-left p-4">
                        <button
                          onClick={() => handleSort('isActive')}
                          className="flex items-center hover:text-primary"
                        >
                          Status {getSortIcon('isActive')}
                        </button>
                      </th>
                      <th className="text-left p-4">
                        <button
                          onClick={() => handleSort('createdAt')}
                          className="flex items-center hover:text-primary"
                        >
                          Created {getSortIcon('createdAt')}
                        </button>
                      </th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleTypes.map((vehicleType) => (
                      <tr key={vehicleType.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{vehicleType.name}</td>
                        <td className="p-4">
                          {vehicleType.icon ? (
                            <span className="text-sm text-gray-500">{vehicleType.icon}</span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <Badge variant={vehicleType.isActive ? 'default' : 'secondary'}>
                            {vehicleType.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {new Date(vehicleType.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={vehicleType.isActive}
                              onCheckedChange={() => handleToggleStatus(vehicleType)}
                              disabled={updateVehicleTypeMutation.isPending}
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(vehicleType)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(vehicleType.id.toString())}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <RowsPerPage
                  value={filters.limit}
                  onChange={(value) => setLimit(value)}
                  options={[5, 10, 20, 50]}
                />
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} vehicle types
                </div>
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => setPage(page)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <VehicleTypeForm
        vehicleType={editingVehicleType}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingVehicleType(undefined);
        }}
      />
    </div>
  );
}
