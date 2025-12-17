'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrapYard } from '@/types';
import { useCreateScrapYard, useUpdateScrapYard } from '@/hooks/use-scrap-yards';
import { employeesApi } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { toast } from 'sonner';
import { GoogleMapPicker } from '@/components/google-map-picker';
import { Users } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth-store';
import { z } from 'zod';

interface ScrapYardFormProps {
  scrapYard?: ScrapYard;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (scrapYard: Partial<ScrapYard>) => void;
}

export function ScrapYardForm({ scrapYard, isOpen, onClose, onSubmit }: ScrapYardFormProps) {
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;

  const schema = z.object({
    organizationId: z.number().int().positive(),
    yardName: z.string().min(2, 'Yard name must be at least 2 characters').max(100, 'Yard name is too long'),
    address: z.string().min(5, 'Address must be at least 5 characters').max(500, 'Address is too long'),
    latitude: z
      .number()
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90')
      .optional()
      .or(z.literal(0)),
    longitude: z
      .number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180')
      .optional()
      .or(z.literal(0)),
    managerId: z.string().optional().or(z.literal('')),
  });

  const [formData, setFormData] = useState<{
    organizationId: number;
    yardName: string;
    address: string;
    latitude: number;
    longitude: number;
    managerId: string;
  }>({
    organizationId,
    yardName: '',
    address: '',
    latitude: 0,
    longitude: 0,
    managerId: '',
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
        organizationId: scrapYard.organizationId || organizationId,
        yardName: scrapYard.yardName || '',
        address: scrapYard.address || '',
        latitude: scrapYard.latitude || 0,
        longitude: scrapYard.longitude || 0,
        managerId: managerId,
      });
    } else {
      // Reset form for new scrap yard
      setFormData({
        organizationId,
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

    // Zod validation
    setValidationErrors({});
    const result = schema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        if (field) {
          errors[field] = issue.message;
        }
      });
      setValidationErrors(errors);
      toast.error(result.error.issues[0]?.message || 'Please fix the highlighted errors');
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
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const isLoading = createScrapYardMutation.isPending || updateScrapYardMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[95vw] sm:max-w-[1100px] max-h-[95vh] bg-white border-0 shadow-2xl rounded-2xl p-0 flex flex-col [&>button]:hidden"
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
                {scrapYard ? 'Edit Scrap Yard' : 'Add New Scrap Yard'}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                Manage yard details, manager assignment and map location.
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
                form="scrap-yard-form"
                disabled={isLoading}
                className="h-10 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {scrapYard ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  scrapYard ? 'Update' : 'Create'
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <form id="scrap-yard-form" onSubmit={handleSubmit} className="px-8 pb-8 space-y-6 pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
              {/* Left Column - Details */}
              <div className="space-y-6">
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Yard Details</h3>
                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="yardName" className="text-sm font-medium text-gray-700">Scrap Yard Name *</Label>
                      <Input
                        id="yardName"
                        value={formData.yardName}
                        onChange={(e) => handleInputChange('yardName', e.target.value)}
                        required
                        disabled={isLoading}
                        placeholder="e.g., Sydney Scrap Yard"
                        className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
                      />
                      {validationErrors.yardName && (
                        <p className="text-xs text-red-500 mt-1">{validationErrors.yardName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="managerId" className="text-sm font-medium text-gray-700">Manager</Label>
                      <Select
                        value={formData.managerId || 'none'}
                        onValueChange={(value) => handleInputChange('managerId', value === 'none' ? '' : value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all">
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
                </div>
              </div>

              {/* Right Column - Location */}
              <div className="space-y-6 h-full flex flex-col">
                <div className="space-y-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location Information</h3>
                  <div className="space-y-2 flex-1 flex flex-col">
                    <div className="flex-1 min-h-[400px]">
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
                    </div>
                    {validationErrors.address && (
                      <p className="text-xs text-red-500 mt-1">{validationErrors.address}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

