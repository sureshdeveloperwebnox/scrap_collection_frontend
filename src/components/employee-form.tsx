'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Employee, ScrapYard } from '@/types';
import { useCreateEmployee, useUpdateEmployee } from '@/hooks/use-employees';
import { useRoles } from '@/hooks/use-roles';
import { useScrapYards } from '@/hooks/use-scrap-yards';
import { toast } from 'sonner';
import { isValidPhoneNumber } from 'libphonenumber-js';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { User, Mail, Lock, MapPin, Shield } from 'lucide-react';

interface EmployeeFormProps {
  employee?: Employee;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (employee: Partial<Employee>) => void;
}

export function EmployeeForm({ employee, isOpen, onClose, onSubmit }: EmployeeFormProps) {
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    organizationId: 1,
    fullName: '',
    email: '',
    phone: '',
    roleId: '',
    scrapYardId: 'none',
    password: '',
  });

  // Fetch roles and scrap yards
  const { data: rolesData } = useRoles({ limit: 100, status: true });
  // Pass status 'true' as string if the API expects string, or boolean if it expects boolean. 
  // Based on use-scrap-yards.ts, it takes params which usually go to API as query params (strings).
  // But type def says `status?: string`. So 'true' is likely correct for active yards.
  const { data: scrapYardsData } = useScrapYards({ limit: 100, status: 'true' });

  const roles = rolesData?.data?.roles || [];
  const scrapYards = ((scrapYardsData?.data as any)?.scrapYards as ScrapYard[]) || [];

  useEffect(() => {
    if (employee) {
      setFormData({
        organizationId: employee.organizationId || 1,
        fullName: employee.fullName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        roleId: (employee as any).roleId?.toString() || (employee as any).role?.id?.toString() || '',
        // Prioritize scrapYardId, fallback to probing scrapYard object, fallback to 'none'
        scrapYardId: employee.scrapYardId?.toString() || (employee as any).scrapYard?.id?.toString() || 'none',
        password: '',
      });
      setPhoneError(undefined);
      setPhoneTouched(false);
      setValidationErrors({});
    } else {
      setFormData({
        organizationId: 1,
        fullName: '',
        email: '',
        phone: '',
        roleId: '',
        scrapYardId: 'none',
        password: '',
      });
      setPhoneError(undefined);
      setPhoneTouched(false);
      setValidationErrors({});
    }
  }, [employee, isOpen]);

  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = "Full name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    if (!formData.roleId) errors.roleId = "Role is required";
    if (!employee && !formData.password) errors.password = "Password is required";

    // Validate phone
    setPhoneTouched(true);
    let validPhone = formData.phone;
    if (!validPhone || validPhone.trim() === '' || validPhone === '+') {
      errors.phone = "Phone number is required";
      setPhoneError("Phone number is required");
    } else {
      // Ensure formatting with +
      if (!validPhone.startsWith('+')) validPhone = '+' + validPhone;

      if (!isValidPhoneNumber(validPhone)) {
        const digits = validPhone.replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 15) {
          errors.phone = "Invalid phone number";
          setPhoneError("Invalid phone number");
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Please fix the validation errors");
      return;
    }

    // Prepare data
    const finalPhone = formData.phone.startsWith('+') ? formData.phone : `+${formData.phone}`;

    const submitData: any = {
      organizationId: formData.organizationId,
      fullName: formData.fullName,
      email: formData.email,
      phone: finalPhone,
      roleId: parseInt(formData.roleId),
    };

    // Add optional fields
    // Use scrapYardId instead of cityId
    if (formData.scrapYardId && formData.scrapYardId !== 'none') {
      submitData.scrapYardId = formData.scrapYardId; // Assuming backend expects string UUID for scrapYardId
    } else {
      submitData.scrapYardId = null;
    }

    try {
      if (employee) {
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
        submitData.password = formData.password;
        await createEmployeeMutation.mutateAsync(submitData);
        toast.success('Employee created successfully!');
      }

      if (onSubmit) {
        onSubmit(submitData);
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving employee:', error);
      const errorMessage = error?.response?.data?.message || error?.message || (employee ? 'Failed to update employee' : 'Failed to create employee');
      toast.error(errorMessage);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear errors
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const isLoading = createEmployeeMutation.isPending || updateEmployeeMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:max-w-[800px] max-h-[90vh] bg-white border-0 shadow-2xl rounded-2xl p-0 flex flex-col [&>button]:hidden text-left"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-4 sm:px-6 lg:px-8 pt-8 pb-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-3xl font-bold text-gray-900">
                {employee ? 'Edit Employee' : 'Add New Employee'}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                {employee ? 'Update employee details and assignments' : 'Fill in the details to create a new employee account'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="h-12 px-6 rounded-xl border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-red-600 font-medium transition-all hover:shadow-md"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="employee-form"
                disabled={isLoading}
                className="h-12 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {employee ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  employee ? 'Update Employee' : 'Create Employee'
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <form id="employee-form" onSubmit={handleSubmit} className="px-4 sm:px-6 lg:px-8 pb-8 space-y-8 mt-6">

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Personal Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                  <User className="h-5 w-5 text-cyan-600" />
                  Personal Information
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name *</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                      <User className="h-5 w-5 text-cyan-600" />
                    </div>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      required
                      disabled={isLoading}
                      className={`pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                        }`}
                      placeholder="Enter full name"
                    />
                  </div>
                  {validationErrors.fullName && <p className="text-sm text-red-600">{validationErrors.fullName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone *</Label>
                  <PhoneInput
                    country={'au'}
                    value={formData.phone}
                    onChange={(value) => {
                      handleInputChange('phone', value);
                      if (phoneError) setPhoneError(undefined);
                    }}
                    inputClass={`!w-full !h-12 !rounded-xl !border-gray-200 !bg-white !shadow-sm focus:!border-cyan-400 focus:!ring-cyan-200 focus:!ring-2 transition-all ${phoneError ? '!border-red-500 focus:!border-red-500' : ''
                      }`}
                    containerClass="!w-full"
                    buttonClass={`!border-gray-200 !rounded-l-xl ${phoneError ? '!border-red-500' : ''}`}
                    disabled={isLoading}
                    preferredCountries={['au', 'us', 'gb', 'in', 'nz', 'ca']}
                  />
                  {phoneError && <p className="text-sm text-red-600">{phoneError}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email *</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                      <Mail className="h-5 w-5 text-cyan-600" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      disabled={isLoading}
                      className={`pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                        }`}
                      placeholder="Enter email address"
                    />
                  </div>
                  {validationErrors.email && <p className="text-sm text-red-600">{validationErrors.email}</p>}
                </div>
              </div>

              {/* Right Column: Role & Security */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-cyan-600" />
                  Role & Security
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="roleId" className="text-sm font-medium text-gray-700">Role *</Label>
                  <div className="relative">
                    <Select
                      value={formData.roleId}
                      onValueChange={(value) => handleInputChange('roleId', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.roleId ? 'border-red-500' : ''
                        }`}>
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
                  {validationErrors.roleId && <p className="text-sm text-red-600">{validationErrors.roleId}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scrapYardId" className="text-sm font-medium text-gray-700">Work Zone (Scrap Yard)</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                      <MapPin className="h-5 w-5 text-cyan-600" />
                    </div>
                    <Select
                      value={formData.scrapYardId || 'none'}
                      onValueChange={(value) => handleInputChange('scrapYardId', value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all">
                        <SelectValue placeholder="Select work zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (No specific zone)</SelectItem>
                        {scrapYards.map((yard) => (
                          <SelectItem key={yard.id} value={yard.id.toString()}>
                            {yard.yardName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    {employee ? 'Change Password' : 'Password *'}
                  </Label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                      <Lock className="h-5 w-5 text-cyan-600" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required={!employee}
                      disabled={isLoading}
                      className={`pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                        }`}
                      placeholder={employee ? "Leave empty to keep current" : "Create a secure password"}
                      minLength={6}
                    />
                  </div>
                  {validationErrors.password && <p className="text-sm text-red-600">{validationErrors.password}</p>}
                </div>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
