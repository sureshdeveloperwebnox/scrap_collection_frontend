'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Lead, ScrapCategory, LeadStatus } from '@/types';
import { useCreateLead, useUpdateLead } from '@/hooks/use-leads';
import { useVehicleTypes } from '@/hooks/use-vehicle-types';
import { toast } from 'sonner';

interface LeadFormProps {
  lead?: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (lead: Partial<Lead>) => void; // Made optional since we're using API
}

export function LeadForm({ lead, isOpen, onClose, onSubmit }: LeadFormProps) {
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    contact: '',
    email: '',
    vehicleTypeId: 1, // Default to first vehicle type ID
    scrapCategory: 'JUNK',
    location: '',
    status: 'NEW',
  });

  // Fetch vehicle types for the dropdown
  const { data: vehicleTypesData } = useVehicleTypes({ isActive: true });
  const vehicleTypes = vehicleTypesData?.data?.vehicleTypes || [];

  // Initialize form data when lead prop changes
  useEffect(() => {
    if (lead) {
      setFormData({
        organizationId: lead.organizationId,
        name: lead.name || '',
        contact: lead.contact || '',
        email: lead.email || '',
        vehicleTypeId: lead.vehicleTypeId || 1,
        scrapCategory: (lead.scrapCategory as ScrapCategory) || 'JUNK',
        location: lead.location || '',
        status: (lead.status as LeadStatus) || 'NEW',
      });
    } else {
      // Reset form for new lead
      setFormData({
        organizationId: 1,
        name: '',
        contact: '',
        email: '',
        vehicleTypeId: vehicleTypes.length > 0 ? vehicleTypes[0].id : 1,
        scrapCategory: 'JUNK',
        location: '',
        status: 'NEW',
      });
    }
  }, [lead, isOpen, vehicleTypes]);

  // API mutations
  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (lead) {
        // Update existing lead
        await updateLeadMutation.mutateAsync({
          id: lead.id,
          data: formData
        });
        toast.success('Lead updated successfully!');
      } else {
        // Create new lead
        await createLeadMutation.mutateAsync(formData as Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>);
        toast.success('Lead created successfully!');
      }
      
      // Call onSubmit callback if provided (for backward compatibility)
      if (onSubmit) {
        onSubmit(formData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error(lead ? 'Failed to update lead' : 'Failed to create lead');
    }
  };

  const handleInputChange = (field: keyof Lead, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = createLeadMutation.isPending || updateLeadMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/30 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {lead ? 'Edit Lead' : 'Add New Lead'}
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
                className="border-gray-200 focus:border-purple-300 focus:ring-purple-200 transition-all duration-200"
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
                className="border-gray-200 focus:border-purple-300 focus:ring-purple-200 transition-all duration-200"
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
              className="border-gray-200 focus:border-purple-300 focus:ring-purple-200 transition-all duration-200"
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
                <SelectTrigger className="border-gray-200 focus:border-purple-300 focus:ring-purple-200 transition-all duration-200">
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
                <SelectTrigger className="border-gray-200 focus:border-purple-300 focus:ring-purple-200 transition-all duration-200">
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
            <Label htmlFor="location" className="text-sm font-semibold text-gray-700">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              required
              disabled={isLoading}
              className="border-gray-200 focus:border-purple-300 focus:ring-purple-200 transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-semibold text-gray-700">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleInputChange('status', value as LeadStatus)}
              disabled={isLoading}
            >
              <SelectTrigger className="border-gray-200 focus:border-purple-300 focus:ring-purple-200 transition-all duration-200">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="CONTACTED">Contacted</SelectItem>
                <SelectItem value="QUALIFIED">Qualified</SelectItem>
                <SelectItem value="CONVERTED">Converted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
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
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 font-semibold"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 bg-white animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {lead ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                lead ? 'Update Lead' : 'Create Lead'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}