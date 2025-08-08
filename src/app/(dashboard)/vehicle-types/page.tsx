'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { VehicleTypeForm } from '@/components/vehicle-type-form';
import { VehicleType } from '@/lib/api/vehicleTypes';
import { Plus, Search, Edit2, Trash2, Loader2, Power, PowerOff } from 'lucide-react';
import { useVehicleTypes, useDeleteVehicleType, useToggleVehicleTypeStatus } from '@/hooks/use-vehicle-types';
import { toast } from 'sonner';

// API response type
interface ApiResponse {
  version: string;
  validationErrors: any[];
  code: number;
  status: string;
  message: string;
  data: {
    vehicleTypes: VehicleType[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function VehicleTypesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicleType, setEditingVehicleType] = useState<VehicleType | undefined>();

  // API hooks
  const { data: vehicleTypesData, isLoading, error } = useVehicleTypes({
    search: searchTerm || undefined,
    limit: 100,
  });

  const deleteVehicleTypeMutation = useDeleteVehicleType();
  const toggleStatusMutation = useToggleVehicleTypeStatus();

  // Handle the actual API response structure
  const apiResponse = vehicleTypesData as unknown as ApiResponse;
  const vehicleTypes = apiResponse?.data?.vehicleTypes || [];
  const totalVehicleTypes = apiResponse?.data?.pagination?.total || 0;

  const handleDeleteVehicleType = async (id: string) => {
    if (confirm('Are you sure you want to delete this vehicle type?')) {
      try {
        await deleteVehicleTypeMutation.mutateAsync(id);
        toast.success('Vehicle type deleted successfully!');
      } catch (error) {
        console.error('Error deleting vehicle type:', error);
        toast.error('Failed to delete vehicle type');
      }
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleStatusMutation.mutateAsync(id);
      toast.success('Vehicle type status updated successfully!');
    } catch (error) {
      console.error('Error toggling vehicle type status:', error);
      toast.error('Failed to update vehicle type status');
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading vehicle types</h2>
          <p className="text-gray-600 mt-2">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Types Management</h1>
          <p className="text-gray-600 mt-1">
            {isLoading ? 'Loading...' : `${totalVehicleTypes} total vehicle types`}
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle Type
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Vehicle Types</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search vehicle types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading vehicle types...</span>
            </div>
          ) : vehicleTypes?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No vehicle types found.</p>
              {searchTerm && (
                <p className="text-sm text-gray-500 mt-1">
                  Try adjusting your search terms.
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleTypes.map((vehicleType) => (
                  <TableRow key={vehicleType.id}>
                    <TableCell className="font-medium">{vehicleType.name}</TableCell>
                    <TableCell className="text-gray-600">{vehicleType.description || 'No description'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(vehicleType.isActive)}`}>
                        {vehicleType.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(vehicleType.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleStatus(vehicleType.id.toString())}
                          disabled={toggleStatusMutation.isPending}
                          title={vehicleType.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {toggleStatusMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : vehicleType.isActive ? (
                            <PowerOff className="h-4 w-4" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingVehicleType(vehicleType);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteVehicleType(vehicleType.id.toString())}
                          disabled={deleteVehicleTypeMutation.isPending}
                        >
                          {deleteVehicleTypeMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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