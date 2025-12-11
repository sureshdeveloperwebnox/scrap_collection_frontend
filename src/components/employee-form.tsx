'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Employee, EmployeeRole } from '@/types';
import { useCreateEmployee, useUpdateEmployee } from '@/hooks/use-employees';
import { useScrapYards } from '@/hooks/use-scrap-yards';
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
    role: 'COLLECTOR' as EmployeeRole,
    workZone: '',
    password: '',
    profilePhoto: '',
    scrapYardId: '',
  });

  const { data: scrapYardsData } = useScrapYards();
  const scrapYards = scrapYardsData?.data?.scrapYards || [];

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
        role: employee.role || 'COLLECTOR',
        workZone: employee.workZone || '',
        password: '', // Don't populate password
        profilePhoto: employee.profilePhoto || '',
        scrapYardId: employee.scrapYardId || '',
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
        role: 'COLLECTOR',
        workZone: '',
        password: '',
        profilePhoto: '',
        scrapYardId: '',
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
    
    // Prepare data with combined phone number
    const submitData = {
      ...formData,
      phone: phoneValidation.formatted || fullPhoneNumber
    };
    
    // Remove countryCode from submit data as it's not in the schema
    delete (submitData as any).countryCode;
    
    try {
      if (employee) {
        await updateEmployeeMutation.mutateAsync({
          id: employee.id,
          data: submitData
        });
        toast.success('Employee updated successfully!');
      } else {
        if (!submitData.password) {
          toast.error('Password is required for new employees');
          return;
        }
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
                <Label htmlFor="role">Role *</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => handleInputChange('role', value as EmployeeRole)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COLLECTOR">Collector</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                    <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scrapYardId">Scrap Yard</Label>
                <Select 
                  value={formData.scrapYardId} 
                  onValueChange={(value) => handleInputChange('scrapYardId', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scrap yard" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {scrapYards.map((yard) => (
                      <SelectItem key={yard.id} value={yard.id}>
                        {yard.yardName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workZone">Work Zone</Label>
              <Input
                id="workZone"
                value={formData.workZone}
                onChange={(e) => handleInputChange('workZone', e.target.value)}
                placeholder="e.g., Sydney Metro, Melbourne North"
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profilePhoto">Profile Photo URL</Label>
              <Input
                id="profilePhoto"
                value={formData.profilePhoto}
                onChange={(e) => handleInputChange('profilePhoto', e.target.value)}
                placeholder="https://..."
                disabled={isLoading}
              />
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
