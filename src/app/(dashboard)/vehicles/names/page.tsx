'use client';

import { useState, useEffect, useMemo } from 'react';
import { useVehicleTypes } from '@/hooks/use-vehicle-types';
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
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, MoreVertical, Car } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicleName, setEditingVehicleName] = useState<VehicleName | undefined>();

  // Fetch vehicle names from API
  const { data: vehicleNamesData, isLoading, error, refetch } = useVehicleNames({
    page,
    limit,
    search: debouncedSearchTerm || undefined,
  });

  // Fetch vehicle types for dropdowns
  const { data: vehicleTypesData } = useVehicleTypes({ page: 1, limit: 100 });

  const createVehicleNameMutation = useCreateVehicleName();
  const updateVehicleNameMutation = useUpdateVehicleName();
  const deleteVehicleNameMutation = useDeleteVehicleName();

  const vehicleTypes = useMemo(() => {
    const apiResponse = vehicleTypesData as any;
    return apiResponse?.data?.vehicleTypes || [];
  }, [vehicleTypesData]) as VehicleType[];


  // Handle API response structure
  const apiResponse = vehicleNamesData as unknown as ApiResponse;
  const vehicleNames = useMemo(() => apiResponse?.data?.vehicleNames || [], [apiResponse]) as VehicleName[];
  const pagination = useMemo(() => apiResponse?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  }, [apiResponse]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

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
    name?: string;
    vehicleTypeId: number;
    make?: string;
    model?: string;
    year?: number;
    vehicleId: string;
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

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading vehicle names</h2>
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
          <h1 className="text-3xl font-bold">Vehicle Names</h1>
          <p className="text-gray-600 mt-1">
            {isLoading ? 'Loading...' : `${pagination.total} Total Vehicle Names`}
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Vehicle Name
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
                  placeholder="Search by name, vehicle type, or scrap yard..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Vehicle Names</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : vehicleNames.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No vehicle names found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle Name</TableHead>
                      <TableHead>Vehicle Type</TableHead>
                      <TableHead>Make</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Vehicle ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleNames.map((vehicleName) => (
                      <TableRow key={vehicleName.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            <Car className="h-4 w-4 text-blue-500" />
                            <span>{vehicleName.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {vehicleName.vehicleType ? (
                            <Badge variant="outline">{vehicleName.vehicleType.name}</Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {vehicleName.make ? (
                            <span className="text-sm">{vehicleName.make}</span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {vehicleName.model ? (
                            <span className="text-sm">{vehicleName.model}</span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {vehicleName.year ? (
                            <span className="text-sm">{vehicleName.year}</span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {vehicleName.vehicleId ? (
                            <span className="text-sm font-mono">{vehicleName.vehicleId}</span>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={vehicleName.isActive ? 'default' : 'secondary'}>
                            {vehicleName.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={vehicleName.isActive}
                              onCheckedChange={() => handleToggleStatus(vehicleName)}
                              disabled={updateVehicleNameMutation.isPending}
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(vehicleName)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(vehicleName.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <RowsPerPage
                  value={limit}
                  onChange={(value) => {
                    setLimit(value);
                    setPage(1);
                  }}
                  options={[5, 10, 20, 50]}
                />
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} vehicle names
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
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVehicleName ? 'Edit Vehicle Name' : 'Add Vehicle Name'}
            </DialogTitle>
          </DialogHeader>
          <VehicleNameForm
            vehicleName={editingVehicleName}
            vehicleTypes={vehicleTypes}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingVehicleName(undefined);
            }}
            isLoading={createVehicleNameMutation.isPending || updateVehicleNameMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Vehicle Name Form Component
function VehicleNameForm({
  vehicleName,
  vehicleTypes,
  onSubmit,
  onCancel,
  isLoading,
}: {
  vehicleName?: VehicleName;
  vehicleTypes: VehicleType[];
  onSubmit: (data: { name?: string; vehicleTypeId: number; make?: string; model?: string; year?: number; vehicleId: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [vehicleTypeId, setVehicleTypeId] = useState<string>(vehicleName?.vehicleTypeId.toString() || '');
  const [make, setMake] = useState((vehicleName as any)?.make || '');
  const [model, setModel] = useState((vehicleName as any)?.model || '');
  const [year, setYear] = useState<string>((vehicleName as any)?.year?.toString() || '');
  const [vehicleId, setVehicleId] = useState((vehicleName as any)?.vehicleId || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleTypeId) {
      toast.error('Please select a vehicle type');
      return;
    }
    if (!make) {
      toast.error('Please provide make');
      return;
    }
    if (!model) {
      toast.error('Please provide model');
      return;
    }
    if (!vehicleId || vehicleId.trim() === '') {
      toast.error('Please provide vehicle ID');
      return;
    }
    
    // Auto-generate name from make and model
    const generatedName = `${make} ${model}`.trim();
    
    onSubmit({
      name: generatedName,
      vehicleTypeId: parseInt(vehicleTypeId),
      make: make,
      model: model,
      year: year ? parseInt(year) : undefined,
      vehicleId: vehicleId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <Label htmlFor="make">Make *</Label>
        <Input
          id="make"
          value={make}
          onChange={(e) => setMake(e.target.value)}
          placeholder="e.g., Toyota"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model *</Label>
        <Input
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="e.g., Camry"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="year">Year</Label>
        <Input
          id="year"
          type="number"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          placeholder="e.g., 2020"
          min="1900"
          max={new Date().getFullYear() + 1}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vehicleId">Vehicle ID *</Label>
        <Input
          id="vehicleId"
          value={vehicleId}
          onChange={(e) => setVehicleId(e.target.value)}
          placeholder="Enter vehicle ID"
          required
          disabled={isLoading}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {vehicleName ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  );
}
