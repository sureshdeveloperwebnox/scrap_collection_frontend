'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Customer, ScrapCategory, CustomerStatus } from '@/types';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/use-customers';
import { useVehicleTypes } from '@/hooks/use-vehicle-types';
import { toast } from 'sonner';

interface CustomerFormProps {
  customer?: Customer;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (customer: Partial<Customer>) => void;
}

export function CustomerForm({ customer, isOpen, onClose, onSubmit }: CustomerFormProps) {
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    contact: '',
    email: '',
    vehicleTypeId: 1,
    scrapCategory: 'JUNK',
    address: '',
    status: 'ACTIVE',
  });

  // Fetch vehicle types for the dropdown
  const { data: vehicleTypesData } = useVehicleTypes({ isActive: true });
  const vehicleTypes = vehicleTypesData?.data?.vehicleTypes || [];

  // Initialize form data when customer prop changes
  useEffect(() => {
    if (customer) {
      setFormData({
        organizationId: customer.organizationId,
        name: customer.name || '',
        contact: customer.contact || '',
        email: customer.email || '',
        vehicleTypeId: customer.vehicleTypeId || 1,
        scrapCategory: (customer.scrapCategory as ScrapCategory) || 'JUNK',
        address: customer.address || '',
        status: (customer.status as CustomerStatus) || 'ACTIVE',
      });
    } else {
      // Reset form for new customer
      setFormData({
        organizationId: 1,
        name: '',
        contact: '',
        email: '',
        vehicleTypeId: vehicleTypes.length > 0 ? vehicleTypes[0].id : 1,
        scrapCategory: 'JUNK',
        address: '',
        status: 'ACTIVE',
      });
    }
  }, [customer, isOpen, vehicleTypes]);

  // API mutations
  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (customer) {
        // Update existing customer
        await updateCustomerMutation.mutateAsync({
          id: customer.id,
          data: formData
        });
        toast.success('Customer updated successfully!');
      } else {
        // Create new customer
        await createCustomerMutation.mutateAsync(formData as Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalOrders' | 'totalSpent' | 'lastOrderDate'>);
        toast.success('Customer created successfully!');
      }
      
      // Call onSubmit callback if provided
      if (onSubmit) {
        onSubmit(formData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast.error(customer ? 'Failed to update customer' : 'Failed to create customer');
    }
  };

  const handleInputChange = (field: keyof Customer, value: string | number) => {
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
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                disabled={isLoading}
                className="border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone</Label>
              <Input
                id="phone"
                value={formData.contact}
                onChange={(e) => handleInputChange('contact', e.target.value)}
                required
                disabled={isLoading}
                className="border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-all duration-200"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              disabled={isLoading}
              className="border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="vehicleType" className="text-sm font-semibold text-gray-700">Vehicle Type</Label>
              <Select 
                value={formData.vehicleTypeId?.toString()} 
                onValueChange={(value) => handleInputChange('vehicleTypeId', parseInt(value))}
                disabled={isLoading}
              >
                <SelectTrigger className="border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-all duration-200">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {vehicleTypes.map((vehicleType) => (
                    <SelectItem key={vehicleType.id} value={vehicleType.id.toString()}>
                      {vehicleType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scrapCategory" className="text-sm font-semibold text-gray-700">Scrap Category</Label>
              <Select 
                value={formData.scrapCategory as string}
                onValueChange={(value) => handleInputChange('scrapCategory', value as ScrapCategory)}
                disabled={isLoading}
              >
                <SelectTrigger className="border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-all duration-200">
                  <SelectValue placeholder="Select scrap category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JUNK">Junk</SelectItem>
                  <SelectItem value="ACCIDENT_DAMAGED">Accident Damaged</SelectItem>
                  <SelectItem value="FULLY_SCRAP">Fully Scrap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-semibold text-gray-700">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              required
              disabled={isLoading}
              className="border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-semibold text-gray-700">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleInputChange('status', value as CustomerStatus)}
              disabled={isLoading}
            >
              <SelectTrigger className="border-gray-200 focus:border-blue-300 focus:ring-blue-200 transition-all duration-200">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="VIP">VIP</SelectItem>
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
              className="border-gray-200 hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 font-semibold"
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
