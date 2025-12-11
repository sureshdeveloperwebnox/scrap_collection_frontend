'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Customer, CustomerStatus } from '@/types';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/use-customers';
import { toast } from 'sonner';
import { CountryCodeSelector } from './country-code-selector';
import { combinePhoneNumber, validatePhoneNumber, validatePhoneNumberByCountry } from '@/utils/phone-validator';
import { parsePhoneNumber } from 'libphonenumber-js';

interface CustomerFormProps {
  customer?: Customer;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (customer: Partial<Customer>) => void;
}

export function CustomerForm({ customer, isOpen, onClose, onSubmit }: CustomerFormProps) {
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined);
  const [phoneTouched, setPhoneTouched] = useState(false);
  
  const [formData, setFormData] = useState({
    organizationId: 1,
    name: '',
    phone: '',
    countryCode: '+1',
    email: '',
    address: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    accountStatus: 'ACTIVE' as CustomerStatus,
  });

  // Initialize form data when customer prop changes
  useEffect(() => {
    if (customer) {
      // Parse existing phone number to extract country code and phone
      let countryCode = '+1';
      let phoneNumber = '';
      
      if (customer.phone) {
        try {
          const parsed = parsePhoneNumber(customer.phone);
          countryCode = `+${parsed.countryCallingCode}`;
          phoneNumber = parsed.nationalNumber;
        } catch (error) {
          // If parsing fails, try to extract country code manually
          const match = customer.phone.match(/^\+(\d{1,3})(.+)$/);
          if (match) {
            countryCode = `+${match[1]}`;
            phoneNumber = match[2].replace(/\D/g, '');
          } else {
            phoneNumber = customer.phone.replace(/\D/g, '');
          }
        }
      }
      
      setFormData({
        organizationId: customer.organizationId || 1,
        name: customer.name || '',
        phone: phoneNumber,
        countryCode: countryCode,
        email: customer.email || '',
        address: customer.address || '',
        latitude: customer.latitude,
        longitude: customer.longitude,
        accountStatus: customer.accountStatus || 'ACTIVE',
      });
      setPhoneError(undefined);
      setPhoneTouched(false);
    } else {
      // Reset form for new customer
      setFormData({
        organizationId: 1,
        name: '',
        phone: '',
        countryCode: '+1',
        email: '',
        address: '',
        latitude: undefined,
        longitude: undefined,
        accountStatus: 'ACTIVE',
      });
      setPhoneError(undefined);
      setPhoneTouched(false);
    }
  }, [customer, isOpen]);

  // API mutations
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();

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
      if (customer) {
        // Update existing customer
        await updateCustomerMutation.mutateAsync({
          id: customer.id,
          data: submitData
        });
        toast.success('Customer updated successfully!');
      } else {
        // Create new customer
        await createCustomerMutation.mutateAsync(submitData);
        toast.success('Customer created successfully!');
      }
      
      if (onSubmit) {
        onSubmit(submitData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error(customer ? 'Failed to update customer' : 'Failed to create customer');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = createCustomerMutation.isPending || updateCustomerMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                disabled={isLoading}
                className="border-gray-200 focus:border-blue-300 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone *</Label>
              <div className="flex gap-2">
                <CountryCodeSelector
                  value={formData.countryCode}
                  onChange={(value) => handleInputChange('countryCode', value)}
                  disabled={isLoading}
                />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    // Only allow digits
                    const value = e.target.value.replace(/\D/g, '');
                    handleInputChange('phone', value);
                  }}
                  required
                  disabled={isLoading}
                  className="flex-1 border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                  placeholder="1234567890"
                  onBlur={(e) => {
                    // Validate on blur
                    const fullPhone = combinePhoneNumber(formData.countryCode, e.target.value);
                    const validation = validatePhoneNumber(fullPhone);
                    if (!validation.isValid && e.target.value) {
                      console.warn('Phone validation:', validation.error);
                    }
                  }}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isLoading}
              className="border-gray-200 focus:border-blue-300 focus:ring-blue-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-semibold text-gray-700">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              disabled={isLoading}
              className="border-gray-200 focus:border-blue-300 focus:ring-blue-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude" className="text-sm font-semibold text-gray-700">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude || ''}
                onChange={(e) => handleInputChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={isLoading}
                className="border-gray-200 focus:border-blue-300 focus:ring-blue-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude" className="text-sm font-semibold text-gray-700">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude || ''}
                onChange={(e) => handleInputChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={isLoading}
                className="border-gray-200 focus:border-blue-300 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountStatus" className="text-sm font-semibold text-gray-700">Account Status</Label>
            <Select 
              value={formData.accountStatus} 
              onValueChange={(value) => handleInputChange('accountStatus', value as CustomerStatus)}
              disabled={isLoading}
            >
              <SelectTrigger className="border-gray-200 focus:border-blue-300 focus:ring-blue-200">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-6 border-t border-gray-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
              className="border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 bg-white animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {customer ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                customer ? 'Update Customer' : 'Create Customer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
