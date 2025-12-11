'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Employee, EmployeeRole } from '@/types';
import { useCreateEmployee, useUpdateEmployee } from '@/hooks/use-employees';
import { useRoles } from '@/hooks/use-roles';
import { useCities } from '@/hooks/use-cities';
import { toast } from 'sonner';
import { CountryCodeSelector } from './country-code-selector';
import { combinePhoneNumber, validatePhoneNumber, validatePhoneNumberByCountry } from '@/utils/phone-validator';
import { parsePhoneNumber } from 'libphonenumber-js';

interface EmployeeFormProps {
  employee?: Employee;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (employee: Partial<Employee>) => void;
}

export function EmployeeForm({ employee, isOpen, onClose, onSubmit }: EmployeeFormProps) {
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined);
  const [phoneTouched, setPhoneTouched] = useState(false);
  
  const [formData, setFormData] = useState({
    organizationId: 1,
    fullName: '',
    email: '',
    phone: '',
    countryCode: '+1',
    roleId: '',
    cityId: 'none',
    password: '', // Only used for updates if needed
  });

  // Fetch roles and cities
  const { data: rolesData } = useRoles({ limit: 100, status: true });
  const { data: citiesData } = useCities({ limit: 100, status: true });
  
  const roles = rolesData?.data?.roles || [];
  const cities = citiesData?.data?.cities || [];

  useEffect(() => {
    if (employee) {
      // Parse existing phone number to extract country code and phone
      let countryCode = '+1';
      let phoneNumber = '';
      
      if (employee.phone) {
        try {
          const parsed = parsePhoneNumber(employee.phone);
          countryCode = `+${parsed.countryCallingCode}`;
          phoneNumber = parsed.nationalNumber;
        } catch (error) {
          // If parsing fails, try to extract country code manually
          const match = employee.phone.match(/^\+(\d{1,3})(.+)$/);
          if (match) {
            countryCode = `+${match[1]}`;
            phoneNumber = match[2].replace(/\D/g, '');
          } else {
            phoneNumber = employee.phone.replace(/\D/g, '');
          }
        }
      }
      
      setFormData({
        organizationId: employee.organizationId || 1,
        fullName: employee.fullName || '',
        email: employee.email || '',
        phone: phoneNumber,
        countryCode: countryCode,
        roleId: (employee as any).roleId?.toString() || (employee as any).role?.id?.toString() || '',
        cityId: (employee as any).cityId?.toString() || (employee as any).city?.id?.toString() || 'none',
        password: '', // Don't populate password
      });
      setPhoneError(undefined);
      setPhoneTouched(false);
    } else {
      setFormData({
        organizationId: 1,
        fullName: '',
        email: '',
        phone: '',
        countryCode: '+1',
        roleId: '',
        cityId: 'none',
        password: '',
      });
      setPhoneError(undefined);
      setPhoneTouched(false);
    }
  }, [employee, isOpen]);

  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine country code and phone number
    const fullPhoneNumber = combinePhoneNumber(formData.countryCode, formData.phone);
    
    // Validate phone number before submit
    setPhoneTouched(true);
    const phoneValidation = validatePhoneNumberByCountry(formData.phone, formData.countryCode);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error);
      toast.error(phoneValidation.error || 'Invalid phone number');
      return;
    }
    
    // Validate roleId
    if (!formData.roleId) {
      toast.error('Please select a role');
      return;
    }

    // Prepare data with combined phone number
    const submitData: any = {
      organizationId: formData.organizationId,
      fullName: formData.fullName,
      email: formData.email,
      phone: phoneValidation.formatted || fullPhoneNumber,
      roleId: parseInt(formData.roleId),
    };
    
    // Add optional fields
    if (formData.cityId && formData.cityId !== 'none') {
      submitData.cityId = parseInt(formData.cityId);
    } else {
      submitData.cityId = null;
    }
    
    try {
      if (employee) {
        // For update, don't include password if not provided
        const updateData: any = { ...submitData };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await updateEmployeeMutation.mutateAsync({
          id: employee.id,
          data: updateData
        });
        toast.success('Employee updated successfully!');
      } else {
        // Password is required for new employees
        if (!formData.password) {
          toast.error('Password is required for new employees');
          return;
        }
        submitData.password = formData.password;
        await createEmployeeMutation.mutateAsync(submitData);
        toast.success('Employee created successfully!');
      }
      
      if (onSubmit) {
        onSubmit(submitData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error(employee ? 'Failed to update employee' : 'Failed to create employee');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = createEmployeeMutation.isPending || updateEmployeeMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <CountryCodeSelector
                      value={formData.countryCode}
                      onChange={(value) => {
                        handleInputChange('countryCode', value);
                        // Re-validate phone when country code changes
                        if (formData.phone && phoneTouched) {
                          const validation = validatePhoneNumberByCountry(formData.phone, value);
                          setPhoneError(validation.isValid ? undefined : validation.error);
                        }
                      }}
                      disabled={isLoading}
                    />
                    <div className="flex-1">
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          // Only allow digits
                          const value = e.target.value.replace(/\D/g, '');
                          handleInputChange('phone', value);
                          
                          // Real-time validation
                          if (phoneTouched || value.length > 0) {
                            const validation = validatePhoneNumberByCountry(value, formData.countryCode);
                            setPhoneError(validation.isValid ? undefined : validation.error);
                          }
                        }}
                        onBlur={() => {
                          setPhoneTouched(true);
                          if (formData.phone) {
                            const validation = validatePhoneNumberByCountry(formData.phone, formData.countryCode);
                            setPhoneError(validation.isValid ? undefined : validation.error);
                          }
                        }}
                        required
                        disabled={isLoading}
                        className={`flex-1 ${
                          phoneError && phoneTouched ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                        }`}
                        placeholder="1234567890"
                      />
                    </div>
                  </div>
                  {phoneError && phoneTouched && (
                    <p className="text-sm text-red-600 mt-1">{phoneError}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {!employee && (
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
            )}
          </div>

          {/* Role & Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Role & Assignment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roleId">Role *</Label>
                <Select 
                  value={formData.roleId} 
                  onValueChange={(value) => handleInputChange('roleId', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cityId">Work Zone (City)</Label>
                <Select 
                  value={formData.cityId || 'none'} 
                  onValueChange={(value) => handleInputChange('cityId', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select work zone (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id.toString()}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {employee ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                employee ? 'Update Employee' : 'Create Employee'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
