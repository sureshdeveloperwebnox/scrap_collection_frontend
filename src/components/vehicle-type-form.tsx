'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { VehicleType } from '@/lib/api/vehicleTypes';
import { useCreateVehicleType, useUpdateVehicleType } from '@/hooks/use-vehicle-types';
import { toast } from 'sonner';

interface VehicleTypeFormProps {
  vehicleType?: VehicleType;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (vehicleType: Partial<VehicleType>) => void;
}

export function VehicleTypeForm({ vehicleType, isOpen, onClose, onSubmit }: VehicleTypeFormProps) {
  const [formData, setFormData] = useState<{ name: string; isActive: boolean }>({
    name: '',

    isActive: true,
  });

  // Initialize form data when vehicleType prop changes
  useEffect(() => {
    if (vehicleType) {
      setFormData({
        name: vehicleType.name || '',

        isActive: vehicleType.isActive ?? true,
      });
    } else {
      // Reset form for new vehicle type
      setFormData({
        name: '',

        isActive: true,
      });
    }
  }, [vehicleType, isOpen]);

  // API mutations
  const createVehicleTypeMutation = useCreateVehicleType();
  const updateVehicleTypeMutation = useUpdateVehicleType();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (vehicleType) {
        // Update existing vehicle type
        await updateVehicleTypeMutation.mutateAsync({
          id: vehicleType.id.toString(),
          data: {
            name: formData.name,

            isActive: formData.isActive,
          }
        });
        toast.success('Vehicle type updated successfully!');
      } else {
        // Create new vehicle type
        await createVehicleTypeMutation.mutateAsync({
          name: formData.name,

          isActive: formData.isActive,
        });
        toast.success('Vehicle type created successfully!');
      }

      // Call onSubmit callback if provided (for backward compatibility)
      if (onSubmit) {
        onSubmit(formData);
      }

      onClose();
    } catch (error) {
      console.error('Error saving vehicle type:', error);
      toast.error(vehicleType ? 'Failed to update vehicle type' : 'Failed to create vehicle type');
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = createVehicleTypeMutation.isPending || updateVehicleTypeMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:max-w-[600px] max-h-[95vh] bg-white border-0 shadow-2xl rounded-2xl p-0 flex flex-col [&>button]:hidden text-left"
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader className="px-4 sm:px-6 lg:px-8 pt-8 pb-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                {vehicleType ? 'Edit Vehicle Type' : 'Create Vehicle Type'}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                {vehicleType ? 'Update vehicle type details' : 'Add a new vehicle type'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="h-10 px-4 rounded-xl border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-red-600 font-medium transition-all hover:shadow-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="vehicle-type-form"
                disabled={isLoading}
                className="h-10 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {vehicleType ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  vehicleType ? 'Update' : 'Create'
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <form id="vehicle-type-form" onSubmit={handleSubmit} className="px-4 sm:px-6 lg:px-8 pb-8 space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                disabled={isLoading}
                placeholder="e.g., Car, Truck, Motorcycle"
                className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-base font-medium text-gray-900">Active Status</Label>
                <p className="text-sm text-gray-500">Enable or disable this vehicle type</p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                disabled={isLoading}
              />
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 