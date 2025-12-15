'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Order, OrderStatus, PaymentStatusEnum } from '@/types';
import { useCreateOrder, useUpdateOrder } from '@/hooks/use-orders';
import { useEmployees } from '@/hooks/use-employees';
import { useScrapYards } from '@/hooks/use-scrap-yards';
import { useCustomers, useCustomer } from '@/hooks/use-customers';
import { toast } from 'sonner';
import { User, Phone, MapPin, Calendar, Package, DollarSign, Clock, FileText, UserCheck, Building2, Users } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { GoogleMapPicker } from '@/components/google-map-picker';
import { useAuthStore } from '@/lib/store/auth-store';
import { DateTimePicker } from '@/components/ui/date-time-picker';

interface OrderFormProps {
  order?: Order;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (order: Partial<Order>) => void;
}

export function OrderForm({ order, isOpen, onClose, onSubmit }: OrderFormProps) {
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;
  
  const [formData, setFormData] = useState({
    organizationId: organizationId,
    leadId: '',
    customerName: '',
    customerPhone: '',
    address: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    vehicleDetails: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      condition: '',
      description: '',
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
  const scrapYards = (scrapYardsData as any)?.data?.scrapYards || (scrapYardsData as any) || [];

  // Fetch customers list for dropdown
  const { data: customersData } = useCustomers({ 
    page: 1, 
    limit: 100,
    status: 'ACTIVE' // Only show active customers
  });
  const customers = customersData?.data?.customers || [];

  // Fetch selected customer details when customerId changes
  const { data: selectedCustomerData } = useCustomer(formData.customerId || '');
  const selectedCustomer = selectedCustomerData?.data;

  // Auto-fill form when customer is selected
  useEffect(() => {
    if (selectedCustomer && formData.customerId && isOpen) {
      // Parse phone number
      let phoneValue = selectedCustomer.phone || '';
      
      setFormData(prev => ({
        ...prev,
        customerName: selectedCustomer.name || prev.customerName,
        customerPhone: phoneValue,
        address: selectedCustomer.address || prev.address,
        latitude: selectedCustomer.latitude !== undefined ? selectedCustomer.latitude : prev.latitude,
        longitude: selectedCustomer.longitude !== undefined ? selectedCustomer.longitude : prev.longitude,
        vehicleDetails: {
          make: selectedCustomer.vehicleMake || prev.vehicleDetails.make,
          model: selectedCustomer.vehicleModel || prev.vehicleDetails.model,
          year: selectedCustomer.vehicleYear || prev.vehicleDetails.year,
          condition: selectedCustomer.vehicleCondition || prev.vehicleDetails.condition,
          description: prev.vehicleDetails.description,
        },
      }));
      
      if (phoneValue) {
        setPhoneError(undefined);
      }
    }
  }, [selectedCustomer, formData.customerId, isOpen]);

  useEffect(() => {
    if (order && isOpen) {
      // Parse existing phone number
      let phoneValue = order.customerPhone || '';
      
      setFormData({
        organizationId: order.organizationId || organizationId,
        leadId: order.leadId || '',
        customerName: order.customerName || '',
        customerPhone: phoneValue,
        address: order.address || '',
        latitude: order.latitude,
        longitude: order.longitude,
        vehicleDetails: { 
          make: order.vehicleDetails?.make || '', 
          model: order.vehicleDetails?.model || '', 
          year: order.vehicleDetails?.year || new Date().getFullYear(), 
          condition: order.vehicleDetails?.condition || '', 
          description: (order.vehicleDetails as any)?.description || '' 
        },
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
    } else if (isOpen) {
      setFormData({
        organizationId: organizationId,
        leadId: '',
        customerName: '',
        customerPhone: '',
        address: '',
        latitude: undefined,
        longitude: undefined,
        vehicleDetails: { make: '', model: '', year: new Date().getFullYear(), condition: '', description: '' },
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
  }, [order, isOpen, organizationId]);

  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number before submit
    setPhoneTouched(true);
    if (formData.customerPhone && formData.customerPhone.trim() !== '' && formData.customerPhone !== '+') {
      try {
        const isValid = isValidPhoneNumber(formData.customerPhone.trim());
        if (!isValid) {
          setPhoneError('Please enter a valid phone number');
          toast.error('Please enter a valid phone number');
          return;
        }
      } catch (error) {
        setPhoneError('Please enter a valid phone number');
        toast.error('Please enter a valid phone number');
        return;
      }
    } else {
      setPhoneError('Phone number is required');
      toast.error('Phone number is required');
      return;
    }
    
    // Prepare submit data
    const submitData: any = {
      organizationId: formData.organizationId,
      customerName: formData.customerName.trim(),
      customerPhone: formData.customerPhone.trim(),
      address: formData.address.trim(),
      vehicleDetails: formData.vehicleDetails,
      orderStatus: formData.orderStatus,
      paymentStatus: formData.paymentStatus,
    };

    // Add optional fields only if they have values
    if (formData.leadId) submitData.leadId = formData.leadId;
    if (formData.customerId) submitData.customerId = formData.customerId;
    
    if (formData.latitude !== undefined && formData.latitude !== null && !isNaN(formData.latitude)) {
      if (!(formData.latitude === 0 && formData.longitude === 0)) {
        submitData.latitude = formData.latitude;
      }
    }
    
    if (formData.longitude !== undefined && formData.longitude !== null && !isNaN(formData.longitude)) {
      if (!(formData.latitude === 0 && formData.longitude === 0)) {
        submitData.longitude = formData.longitude;
      }
    }
    
    if (formData.assignedCollectorId) submitData.assignedCollectorId = formData.assignedCollectorId;
    if (formData.pickupTime) submitData.pickupTime = formData.pickupTime;
    if (formData.quotedPrice !== undefined) submitData.quotedPrice = formData.quotedPrice;
    if (formData.actualPrice !== undefined) submitData.actualPrice = formData.actualPrice;
    if (formData.yardId) submitData.yardId = formData.yardId;
    if (formData.customerNotes) submitData.customerNotes = formData.customerNotes.trim();
    if (formData.adminNotes) submitData.adminNotes = formData.adminNotes.trim();
    
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
    } catch (error: any) {
      console.error('Error saving order:', error);
      const errorMessage = error?.response?.data?.message || error?.message || (order ? 'Failed to update order' : 'Failed to create order');
      toast.error(errorMessage);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'customerPhone' && phoneError) {
      setPhoneError(undefined);
    }
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
      <DialogContent 
        className="w-[95vw] sm:max-w-[1400px] max-h-[95vh] bg-white border-0 shadow-2xl rounded-2xl p-0 flex flex-col [&>button]:hidden"
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
              <DialogTitle className="text-3xl font-bold text-gray-900">
                {order ? 'Edit Order' : 'Create New Order'}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                {order ? 'Update order information and status' : 'Fill in the details to create a new work order'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isLoading}
                className="h-12 px-6 rounded-xl border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-red-600 font-medium transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:text-gray-700"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                form="order-form"
                disabled={isLoading}
                className="h-12 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {order ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  order ? 'Update Order' : 'Create Order'
                )}
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto min-h-0">
          <form id="order-form" onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
            {/* Main Two-Column Layout for Landscape Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Customer Information</h3>
                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="customerId" className="text-sm font-medium text-gray-700">Select Customer</Label>
                      <Select 
                        value={formData.customerId || 'none'} 
                        onValueChange={(value) => {
                          if (value === 'none') {
                            handleInputChange('customerId', '');
                            handleInputChange('customerName', '');
                            handleInputChange('customerPhone', '');
                            handleInputChange('address', '');
                            handleInputChange('latitude', undefined);
                            handleInputChange('longitude', undefined);
                          } else {
                            handleInputChange('customerId', value);
                          }
                        }}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all">
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-cyan-600" />
                            <SelectValue placeholder="Select customer" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="none">None (New Customer)</SelectItem>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} {customer.phone ? `(${customer.phone})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.customerId ? 'Customer details will be auto-filled below' : 'Select a customer to auto-fill their details'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">Customer Name *</Label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-cyan-600" />
                          </div>
                        </div>
                        <Input
                          id="customerName"
                          value={formData.customerName}
                          onChange={(e) => handleInputChange('customerName', e.target.value)}
                          required
                          disabled={isLoading || !!formData.customerId}
                          className={`pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${
                            formData.customerId ? 'bg-gray-50 cursor-not-allowed' : ''
                          }`}
                          placeholder="Enter customer name"
                        />
                      </div>
                      {formData.customerId && (
                        <p className="text-xs text-gray-500 mt-1">Auto-filled from selected customer</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customerPhone" className="text-sm font-medium text-gray-700">Customer Phone *</Label>
                      <div className="flex flex-col gap-2">
                        <PhoneInput
                          country={(() => {
                            if (formData.customerPhone) {
                              try {
                                const phoneNumber = formData.customerPhone.startsWith('+') ? formData.customerPhone : `+${formData.customerPhone}`;
                                const parsed = parsePhoneNumber(phoneNumber);
                                if (parsed && parsed.country) {
                                  return parsed.country.toLowerCase();
                                }
                              } catch (e) {
                                // If parsing fails, use default
                              }
                            }
                            return 'au'; // Default to Australia
                          })()}
                          value={formData.customerPhone?.replace(/^\+/, '') || ''}
                          preferredCountries={['au', 'us', 'gb', 'in', 'nz', 'ca']}
                          disableCountryGuess={true}
                          disableDropdown={false}
                          onChange={(value) => {
                            const phoneWithPlus = value ? `+${value}` : '';
                            handleInputChange('customerPhone', phoneWithPlus);
                            
                            if (phoneError) {
                              setPhoneError(undefined);
                            }
                          }}
                          onBlur={() => {
                            setPhoneTouched(true);
                            if (formData.customerPhone && formData.customerPhone.trim() !== '' && formData.customerPhone !== '+') {
                              try {
                                const isValid = isValidPhoneNumber(formData.customerPhone);
                                setPhoneError(isValid ? undefined : 'Please enter a valid phone number');
                              } catch (error) {
                                setPhoneError('Please enter a valid phone number');
                              }
                            } else {
                              setPhoneError('Phone number is required');
                            }
                          }}
                          disableCountryCode={false}
                          inputProps={{
                            required: true,
                            autoComplete: 'tel'
                          }}
                          inputClass={`!w-full !h-12 !rounded-xl !border-gray-200 !bg-white !shadow-sm focus:!border-cyan-400 focus:!ring-cyan-200 focus:!ring-2 transition-all ${
                            phoneError && phoneTouched ? '!border-red-500 focus:!border-red-500 focus:!ring-red-200' : ''
                          } ${
                            formData.customerId && selectedCustomer?.phone ? '!bg-cyan-50 !border-cyan-200' : ''
                          }`}
                          buttonClass={`!border-gray-200 !rounded-l-xl ${phoneError && phoneTouched ? '!border-red-500' : ''} ${
                            formData.customerId && selectedCustomer?.phone ? '!border-cyan-200' : ''
                          }`}
                          containerClass={`!w-full ${phoneError && phoneTouched ? 'error' : ''}`}
                          disabled={isLoading}
                          placeholder="Enter phone number"
                          specialLabel=""
                        />
                        {phoneError && phoneTouched && (
                          <p className="text-sm text-red-600 mt-1">{phoneError}</p>
                        )}
                        {formData.customerId && selectedCustomer?.phone && (
                          <p className="text-xs text-cyan-600 mt-1 flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            Auto-filled from selected customer
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Details */}
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Vehicle Details</h3>
                  {formData.customerId && selectedCustomer && (selectedCustomer.vehicleMake || selectedCustomer.vehicleModel || selectedCustomer.vehicleYear || selectedCustomer.vehicleCondition) && (
                    <div className="mb-3 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                      <p className="text-xs text-cyan-700 font-medium flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Vehicle details auto-filled from selected customer
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="vehicleMake" className="text-sm font-medium text-gray-700">Vehicle Make</Label>
                      <Input
                        id="vehicleMake"
                        value={formData.vehicleDetails.make}
                        onChange={(e) => handleVehicleDetailChange('make', e.target.value)}
                        placeholder="e.g., Toyota"
                        disabled={isLoading}
                        className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${
                          formData.customerId && selectedCustomer?.vehicleMake ? 'bg-cyan-50 border-cyan-200' : ''
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicleModel" className="text-sm font-medium text-gray-700">Model</Label>
                      <Input
                        id="vehicleModel"
                        value={formData.vehicleDetails.model}
                        onChange={(e) => handleVehicleDetailChange('model', e.target.value)}
                        placeholder="e.g., Corolla"
                        disabled={isLoading}
                        className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${
                          formData.customerId && selectedCustomer?.vehicleModel ? 'bg-cyan-50 border-cyan-200' : ''
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicleYear" className="text-sm font-medium text-gray-700">Vehicle Year</Label>
                      <Select 
                        value={formData.vehicleDetails.year?.toString() || ''}
                        onValueChange={(value) => handleVehicleDetailChange('year', parseInt(value) || new Date().getFullYear())}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-cyan-600" />
                            <SelectValue placeholder="Select year">
                              {formData.vehicleDetails.year || 'Select year'}
                            </SelectValue>
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {Array.from({ length: new Date().getFullYear() + 2 - 1900 }, (_, i) => {
                            const year = new Date().getFullYear() + 1 - i;
                            return (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicleCondition" className="text-sm font-medium text-gray-700">Vehicle Condition</Label>
                      <Select 
                        value={formData.vehicleDetails.condition || 'none'}
                        onValueChange={(value) => handleVehicleDetailChange('condition', value === 'none' ? '' : value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="JUNK">Junk</SelectItem>
                          <SelectItem value="DAMAGED">Damaged</SelectItem>
                          <SelectItem value="WRECKED">Wrecked</SelectItem>
                          <SelectItem value="ACCIDENTAL">Accidental</SelectItem>
                          <SelectItem value="FULLY_SCRAP">Fully Scrap</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleDescription" className="text-sm font-medium text-gray-700">Vehicle Description</Label>
                    <textarea
                      id="vehicleDescription"
                      value={formData.vehicleDetails.description || ''}
                      onChange={(e) => handleVehicleDetailChange('description', e.target.value)}
                      placeholder="Enter vehicle description (e.g., color, additional details, damage description, etc.)"
                      disabled={isLoading}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Pickup Information */}
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Pickup Information</h3>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="pickupTime" className="text-sm font-medium text-gray-700">Pick Up Date &amp; Time</Label>
                      <DateTimePicker
                        date={formData.pickupTime}
                        onDateChange={(date) => handleInputChange('pickupTime', date)}
                        disabled={isLoading}
                        placeholder="Select pickup date and time"
                        showTime={true}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Assignment & Pricing */}
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Assignment &amp; Pricing</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="assignedCollectorId" className="text-sm font-medium text-gray-700">Assigned Collector</Label>
                      <Select 
                        value={formData.assignedCollectorId || 'none'} 
                        onValueChange={(value) => handleInputChange('assignedCollectorId', value === 'none' ? '' : value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all">
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-cyan-600" />
                            <SelectValue placeholder="Select collector" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {employees.map((emp: any) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yardId" className="text-sm font-medium text-gray-700">Scrap Yard</Label>
                      <Select 
                        value={formData.yardId || 'none'} 
                        onValueChange={(value) => handleInputChange('yardId', value === 'none' ? '' : value)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-cyan-600" />
                            <SelectValue placeholder="Select scrap yard" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {scrapYards.map((yard: any) => (
                            <SelectItem key={yard.id} value={yard.id}>
                              {yard.yardName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quotedPrice" className="text-sm font-medium text-gray-700">Quoted Price ($)</Label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-cyan-600" />
                          </div>
                        </div>
                        <Input
                          id="quotedPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.quotedPrice || ''}
                          onChange={(e) => handleInputChange('quotedPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                          disabled={isLoading}
                          className="pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actualPrice" className="text-sm font-medium text-gray-700">Actual Price ($)</Label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <Input
                          id="actualPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.actualPrice || ''}
                          onChange={(e) => handleInputChange('actualPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                          disabled={isLoading}
                          className="pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="orderStatus" className="text-sm font-medium text-gray-700">Order Status</Label>
                    <Select 
                      value={formData.orderStatus} 
                      onValueChange={(value) => handleInputChange('orderStatus', value as OrderStatus)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all">
                        <div className="flex items-center gap-2">
                          <Package className="h-5 w-5 text-cyan-600" />
                          <SelectValue placeholder="Select status" />
                        </div>
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
                    <Label htmlFor="paymentStatus" className="text-sm font-medium text-gray-700">Payment Status</Label>
                    <Select 
                      value={formData.paymentStatus} 
                      onValueChange={(value) => handleInputChange('paymentStatus', value as PaymentStatusEnum)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-cyan-600" />
                          <SelectValue placeholder="Select payment status" />
                        </div>
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
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Notes</h3>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="customerNotes" className="text-sm font-medium text-gray-700">Customer Notes</Label>
                      <div className="relative">
                        <div className="absolute left-4 top-4 z-10">
                          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-cyan-600" />
                          </div>
                        </div>
                        <textarea
                          id="customerNotes"
                          value={formData.customerNotes}
                          onChange={(e) => handleInputChange('customerNotes', e.target.value)}
                          rows={3}
                          disabled={isLoading}
                          className="w-full pl-14 pr-4 py-3 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all resize-none"
                          placeholder="Customer notes..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminNotes" className="text-sm font-medium text-gray-700">Admin Notes</Label>
                      <div className="relative">
                        <div className="absolute left-4 top-4 z-10">
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <textarea
                          id="adminNotes"
                          value={formData.adminNotes}
                          onChange={(e) => handleInputChange('adminNotes', e.target.value)}
                          rows={3}
                          disabled={isLoading}
                          className="w-full pl-14 pr-4 py-3 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all resize-none"
                          placeholder="Internal admin notes..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6 lg:sticky lg:top-4">
                {/* Location Information */}
                <div className="space-y-5 w-full">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location Information</h3>
                  <div className="space-y-5 w-full">
                    <div className="space-y-2 w-full">
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700">Collection Address *</Label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-cyan-600" />
                          </div>
                        </div>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          required
                          disabled={isLoading}
                          className={`pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${
                            formData.customerId && selectedCustomer?.address ? 'bg-cyan-50 border-cyan-200' : ''
                          }`}
                          placeholder="Enter collection address"
                        />
                      </div>
                      {formData.customerId && selectedCustomer?.address && (
                        <p className="text-xs text-cyan-600 mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Auto-filled from selected customer's address
                        </p>
                      )}
                    </div>
                    {/* Google Map Picker */}
                    <div className="space-y-2 w-full">
                      <GoogleMapPicker
                        address={formData.address || ''}
                        latitude={formData.latitude || 0}
                        longitude={formData.longitude || 0}
                        onAddressChange={(address) => {
                          handleInputChange('address', address);
                        }}
                        onLocationChange={(lat, lng) => {
                          handleInputChange('latitude', lat);
                          handleInputChange('longitude', lng);
                        }}
                        showCoordinates={false}
                        mapHeight={350}
                      />
                    </div>
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
