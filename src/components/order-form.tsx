'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Order, OrderStatus, PaymentStatusEnum } from '@/types';
import { useCreateOrder, useUpdateOrder } from '@/hooks/use-orders';
import { useEmployees } from '@/hooks/use-employees';
import { useScrapYards } from '@/hooks/use-scrap-yards';
import { toast } from 'sonner';
import { CountryCodeSelector } from './country-code-selector';
import { combinePhoneNumber, validatePhoneNumber, validatePhoneNumberByCountry } from '@/utils/phone-validator';
import { parsePhoneNumber } from 'libphonenumber-js';

interface OrderFormProps {
  order?: Order;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (order: Partial<Order>) => void;
}

export function OrderForm({ order, isOpen, onClose, onSubmit }: OrderFormProps) {
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined);
  const [phoneTouched, setPhoneTouched] = useState(false);
  
  const [formData, setFormData] = useState({
    organizationId: 1,
    leadId: '',
    customerName: '',
    customerPhone: '',
    customerCountryCode: '+1',
    address: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    vehicleDetails: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      condition: '',
    },
    assignedCollectorId: '',
    pickupTime: undefined as Date | undefined,
    quotedPrice: undefined as number | undefined,
    actualPrice: undefined as number | undefined,
    yardId: '',
    customerNotes: '',
    adminNotes: '',
    customerId: '',
    orderStatus: 'PENDING' as OrderStatus,
    paymentStatus: 'UNPAID' as PaymentStatusEnum,
  });

  // Fetch employees and scrap yards
  const { data: employeesData } = useEmployees({ role: 'COLLECTOR', isActive: true });
  const { data: scrapYardsData } = useScrapYards();
  const employees = employeesData?.data?.employees || [];
  const scrapYards = scrapYardsData?.data?.scrapYards || [];

  useEffect(() => {
    if (order) {
      // Parse existing phone number to extract country code and phone
      let countryCode = '+1';
      let phoneNumber = '';
      
      if (order.customerPhone) {
        try {
          const parsed = parsePhoneNumber(order.customerPhone);
          countryCode = `+${parsed.countryCallingCode}`;
          phoneNumber = parsed.nationalNumber;
        } catch (error) {
          // If parsing fails, try to extract country code manually
          const match = order.customerPhone.match(/^\+(\d{1,3})(.+)$/);
          if (match) {
            countryCode = `+${match[1]}`;
            phoneNumber = match[2].replace(/\D/g, '');
          } else {
            phoneNumber = order.customerPhone.replace(/\D/g, '');
          }
        }
      }
      
      setFormData({
        organizationId: order.organizationId || 1,
        leadId: order.leadId || '',
        customerName: order.customerName || '',
        customerPhone: phoneNumber,
        customerCountryCode: countryCode,
        address: order.address || '',
        latitude: order.latitude,
        longitude: order.longitude,
        vehicleDetails: order.vehicleDetails || { make: '', model: '', year: new Date().getFullYear(), condition: '' },
        assignedCollectorId: order.assignedCollectorId || '',
        pickupTime: order.pickupTime,
        quotedPrice: order.quotedPrice,
        actualPrice: order.actualPrice,
        yardId: order.yardId || '',
        customerNotes: order.customerNotes || '',
        adminNotes: order.adminNotes || '',
        customerId: order.customerId || '',
        orderStatus: order.orderStatus || 'PENDING',
        paymentStatus: order.paymentStatus || 'UNPAID',
      });
      setPhoneError(undefined);
      setPhoneTouched(false);
    } else {
      setFormData({
        organizationId: 1,
        leadId: '',
        customerName: '',
        customerPhone: '',
        customerCountryCode: '+1',
        address: '',
        latitude: undefined,
        longitude: undefined,
        vehicleDetails: { make: '', model: '', year: new Date().getFullYear(), condition: '' },
        assignedCollectorId: '',
        pickupTime: undefined,
        quotedPrice: undefined,
        actualPrice: undefined,
        yardId: '',
        customerNotes: '',
        adminNotes: '',
        customerId: '',
        orderStatus: 'PENDING',
        paymentStatus: 'UNPAID',
      });
      setPhoneError(undefined);
      setPhoneTouched(false);
    }
  }, [order, isOpen]);

  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number before submit
    setPhoneTouched(true);
    const phoneValidation = validatePhoneNumberByCountry(formData.customerPhone, formData.customerCountryCode);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error);
      toast.error(phoneValidation.error || 'Invalid phone number');
      return;
    }
    
    // Combine country code and phone number
    const fullPhoneNumber = combinePhoneNumber(formData.customerCountryCode, formData.customerPhone);
    
    // Prepare data with combined phone number
    const submitData = {
      ...formData,
      customerPhone: phoneValidation.formatted || fullPhoneNumber
    };
    
    // Remove customerCountryCode from submit data as it's not in the schema
    delete (submitData as any).customerCountryCode;
    
    try {
      if (order) {
        await updateOrderMutation.mutateAsync({
          id: order.id,
          data: submitData
        });
        toast.success('Order updated successfully!');
      } else {
        await createOrderMutation.mutateAsync(submitData);
        toast.success('Order created successfully!');
      }
      
      if (onSubmit) {
        onSubmit(submitData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error(order ? 'Failed to update order' : 'Failed to create order');
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVehicleDetailChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      vehicleDetails: { ...prev.vehicleDetails, [field]: value }
    }));
  };

  const isLoading = createOrderMutation.isPending || updateOrderMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {order ? 'Edit Order' : 'Create New Order'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Customer Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Customer Phone *</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <CountryCodeSelector
                      value={formData.customerCountryCode}
                      onChange={(value) => {
                        handleInputChange('customerCountryCode', value);
                        // Re-validate phone when country code changes
                        if (formData.customerPhone && phoneTouched) {
                          const validation = validatePhoneNumberByCountry(formData.customerPhone, value);
                          setPhoneError(validation.isValid ? undefined : validation.error);
                        }
                      }}
                      disabled={isLoading}
                    />
                    <div className="flex-1">
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => {
                          // Only allow digits
                          const value = e.target.value.replace(/\D/g, '');
                          handleInputChange('customerPhone', value);
                          
                          // Real-time validation
                          if (phoneTouched || value.length > 0) {
                            const validation = validatePhoneNumberByCountry(value, formData.customerCountryCode);
                            setPhoneError(validation.isValid ? undefined : validation.error);
                          }
                        }}
                        onBlur={() => {
                          setPhoneTouched(true);
                          if (formData.customerPhone) {
                            const validation = validatePhoneNumberByCountry(formData.customerPhone, formData.customerCountryCode);
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
          </div>

          {/* Vehicle Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Vehicle Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleMake">Make</Label>
                <Input
                  id="vehicleMake"
                  value={formData.vehicleDetails.make}
                  onChange={(e) => handleVehicleDetailChange('make', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleModel">Model</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleDetails.model}
                  onChange={(e) => handleVehicleDetailChange('model', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleYear">Year</Label>
                <Input
                  id="vehicleYear"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.vehicleDetails.year}
                  onChange={(e) => handleVehicleDetailChange('year', parseInt(e.target.value) || new Date().getFullYear())}
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleCondition">Condition</Label>
              <Input
                id="vehicleCondition"
                value={formData.vehicleDetails.condition}
                onChange={(e) => handleVehicleDetailChange('condition', e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Pickup Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Pickup Information</h3>
            <div className="space-y-2">
              <Label htmlFor="address">Pickup Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude || ''}
                  onChange={(e) => handleInputChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude || ''}
                  onChange={(e) => handleInputChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupTime">Pickup Time</Label>
                <Input
                  id="pickupTime"
                  type="datetime-local"
                  value={formData.pickupTime ? new Date(formData.pickupTime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleInputChange('pickupTime', e.target.value ? new Date(e.target.value) : undefined)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Assignment & Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Assignment & Pricing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedCollectorId">Assigned Collector</Label>
                <Select 
                  value={formData.assignedCollectorId} 
                  onValueChange={(value) => handleInputChange('assignedCollectorId', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select collector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yardId">Scrap Yard</Label>
                <Select 
                  value={formData.yardId} 
                  onValueChange={(value) => handleInputChange('yardId', value)}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quotedPrice">Quoted Price ($)</Label>
                <Input
                  id="quotedPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.quotedPrice || ''}
                  onChange={(e) => handleInputChange('quotedPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualPrice">Actual Price ($)</Label>
                <Input
                  id="actualPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.actualPrice || ''}
                  onChange={(e) => handleInputChange('actualPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="orderStatus">Order Status</Label>
              <Select 
                value={formData.orderStatus} 
                onValueChange={(value) => handleInputChange('orderStatus', value as OrderStatus)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <Select 
                value={formData.paymentStatus} 
                onValueChange={(value) => handleInputChange('paymentStatus', value as PaymentStatusEnum)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerNotes">Customer Notes</Label>
              <textarea
                id="customerNotes"
                value={formData.customerNotes}
                onChange={(e) => handleInputChange('customerNotes', e.target.value)}
                rows={2}
                disabled={isLoading}
                className="w-full px-3 py-2 border rounded-md resize-none"
                placeholder="Customer notes..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminNotes">Admin Notes</Label>
              <textarea
                id="adminNotes"
                value={formData.adminNotes}
                onChange={(e) => handleInputChange('adminNotes', e.target.value)}
                rows={2}
                disabled={isLoading}
                className="w-full px-3 py-2 border rounded-md resize-none"
                placeholder="Internal admin notes..."
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
                  {order ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                order ? 'Update Order' : 'Create Order'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
