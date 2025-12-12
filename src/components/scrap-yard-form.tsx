'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrapYard } from '@/types';
import { useCreateScrapYard, useUpdateScrapYard } from '@/hooks/use-scrap-yards';
import { employeesApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';
import { GoogleMapPicker } from '@/components/google-map-picker';
import { Users } from 'lucide-react';

interface ScrapYardFormProps {
  scrapYard?: ScrapYard;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (scrapYard: Partial<ScrapYard>) => void;
}

export function ScrapYardForm({ scrapYard, isOpen, onClose, onSubmit }: ScrapYardFormProps) {
  const [formData, setFormData] = useState<{
    organizationId: number;
    yardName: string;
    address: string;
    latitude: number;
    longitude: number;
    managerId: string;
  }>({
    organizationId: 1, // Default organization ID, should come from auth context
    yardName: '',
    address: '',
    latitude: 0,
    longitude: 0,
    managerId: '',
  });

  // Fetch active employees for manager selection
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'for-manager-selection'],
    queryFn: () => employeesApi.getEmployees({ 
      isActive: true,
      limit: 100 // Get more employees for selection
    }),
  });

  const employees = useMemo(() => {
    const apiResponse = employeesData as any;
    return apiResponse?.data?.employees || [];
  }, [employeesData]);

  // Initialize form data when scrapYard prop changes
  useEffect(() => {
    if (scrapYard) {
      // Get manager from employees array or assignedEmployeeIds
      let managerId = '';
      if (scrapYard.employees && scrapYard.employees.length > 0) {
        // Find manager/supervisor or use first employee
        const manager = scrapYard.employees.find(
          (emp) => emp.role?.name?.toUpperCase().includes('MANAGER') || 
                   emp.role?.name?.toUpperCase().includes('SUPERVISOR')
        );
        managerId = manager?.id || scrapYard.employees[0]?.id || '';
      } else if (scrapYard.assignedEmployeeIds && scrapYard.assignedEmployeeIds.length > 0) {
        managerId = scrapYard.assignedEmployeeIds[0];
      }

      setFormData({
        organizationId: scrapYard.organizationId,
        yardName: scrapYard.yardName || '',
        address: scrapYard.address || '',
        latitude: scrapYard.latitude || 0,
        longitude: scrapYard.longitude || 0,
        managerId: managerId,
      });
    } else {
      // Reset form for new scrap yard
      setFormData({
        organizationId: 1,
        yardName: '',
        address: '',
        latitude: 0,
        longitude: 0,
        managerId: '',
      });
    }
  }, [scrapYard, isOpen]);

  // API mutations
  const createScrapYardMutation = useCreateScrapYard();
  const updateScrapYardMutation = useUpdateScrapYard();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.yardName.trim()) {
      toast.error('Yard name is required');
      return;
    }
    
    if (!formData.address.trim()) {
      toast.error('Address is required');
      return;
    }
    
    // Validate coordinates if provided
    if (formData.latitude && (formData.latitude < -90 || formData.latitude > 90)) {
      toast.error('Latitude must be between -90 and 90');
      return;
    }
    
    if (formData.longitude && (formData.longitude < -180 || formData.longitude > 180)) {
      toast.error('Longitude must be between -180 and 180');
      return;
    }
    
    try {
      // Prepare assignedEmployeeIds - include manager if selected
      const assignedEmployeeIds = formData.managerId ? [formData.managerId] : [];

      if (scrapYard) {
        // Update existing scrap yard
        await updateScrapYardMutation.mutateAsync({
          id: scrapYard.id,
          data: {
            yardName: formData.yardName,
            address: formData.address,
            latitude: formData.latitude || undefined,
            longitude: formData.longitude || undefined,
            assignedEmployeeIds: assignedEmployeeIds.length > 0 ? assignedEmployeeIds : undefined,
          }
        });
        toast.success('Scrap yard updated successfully!');
      } else {
        // Create new scrap yard
        await createScrapYardMutation.mutateAsync({
          organizationId: formData.organizationId,
          yardName: formData.yardName,
          address: formData.address,
          latitude: formData.latitude || undefined,
          longitude: formData.longitude || undefined,
          assignedEmployeeIds: assignedEmployeeIds.length > 0 ? assignedEmployeeIds : undefined,
        });
        toast.success('Scrap yard created successfully!');
      }
      
      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit(formData);
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error saving scrap yard:', error);
      toast.error(error?.message || (scrapYard ? 'Failed to update scrap yard' : 'Failed to create scrap yard'));
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = createScrapYardMutation.isPending || updateScrapYardMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{scrapYard ? 'Edit Scrap Yard' : 'Add New Scrap Yard'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Horizontal form fields row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yardName">Scrap Yard Name</Label>
              <Input
                id="yardName"
                value={formData.yardName}
                onChange={(e) => handleInputChange('yardName', e.target.value)}
                required
                disabled={isLoading}
                placeholder="e.g., Sydney Scrap Yard"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="managerId">Manager</Label>
              <Select
                value={formData.managerId || 'none'}
                onValueChange={(value) => handleInputChange('managerId', value === 'none' ? '' : value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Select a manager" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Manager</SelectItem>
                  {employees.map((employee: any) => {
                    const roleName = employee.role?.name || employee.role || '';
                    return (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.fullName} {roleName ? `(${roleName})` : ''}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Select a manager to assign to this scrap yard.
              </p>
            </div>
          </div>
          
          {/* Location section - full width */}
          <GoogleMapPicker
            latitude={formData.latitude}
            longitude={formData.longitude}
            onLocationChange={(lat, lng) => {
              setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
            }}
            address={formData.address}
            onAddressChange={(address) => {
              setFormData(prev => ({ ...prev, address }));
            }}
          />

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
                  {scrapYard ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                scrapYard ? 'Update Scrap Yard' : 'Create Scrap Yard'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

