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
  const [formData, setFormData] = useState<{ name: string; icon?: string; isActive: boolean }>({
    name: '',
    icon: '',
    isActive: true,
  });

  // Initialize form data when vehicleType prop changes
  useEffect(() => {
    if (vehicleType) {
      setFormData({
        name: vehicleType.name || '',
        icon: vehicleType.icon || '',
        isActive: vehicleType.isActive ?? true,
      });
    } else {
      // Reset form for new vehicle type
      setFormData({
        name: '',
        icon: '',
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
            icon: formData.icon || undefined,
            isActive: formData.isActive,
          }
        });
        toast.success('Vehicle type updated successfully!');
      } else {
        // Create new vehicle type
        await createVehicleTypeMutation.mutateAsync({
          name: formData.name,
          icon: formData.icon || undefined,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{vehicleType ? 'Edit Vehicle Type' : 'Add New Vehicle Type'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              disabled={isLoading}
              placeholder="e.g., Car, Truck, Motorcycle"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="icon">Icon URL (Optional)</Label>
            <Input
              id="icon"
              value={formData.icon || ''}
              onChange={(e) => handleInputChange('icon', e.target.value)}
              disabled={isLoading}
              placeholder="Icon URL or identifier"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              disabled={isLoading}
            />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {vehicleType ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                vehicleType ? 'Update Vehicle Type' : 'Create Vehicle Type'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 