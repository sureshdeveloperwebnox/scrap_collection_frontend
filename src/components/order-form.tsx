'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Order, OrderStatus, PaymentStatusEnum, VehicleTypeEnum } from '@/types';
import { useCreateOrder, useUpdateOrder } from '@/hooks/use-orders';
import { useCustomers, useCustomer } from '@/hooks/use-customers';
import { useScrapCategories, useScrapNames } from '@/hooks/use-scrap';
import { toast } from 'sonner';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Package,
  DollarSign,
  FileText,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Truck,
  Users
} from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { GoogleMapPicker } from '@/components/google-map-picker';
import { useAuthStore } from '@/lib/store/auth-store';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { OrderAssignmentStepper } from '@/components/order-assignment-stepper';

interface OrderFormProps {
  order?: Order;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (order: Partial<Order>) => void;
}

export function OrderForm({ order, isOpen, onClose, onSubmit }: OrderFormProps) {

  const [currentStep, setCurrentStep] = useState(1);
  const [showAssignmentStepper, setShowAssignmentStepper] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const { user } = useAuthStore();
  const organizationId = user?.organizationId || 1;
  const queryClient = useQueryClient();

  // Invalidate all queries when dialog opens
  useEffect(() => {
    if (isOpen) {
      queryClient.invalidateQueries({ queryKey: ['scrap-categories'] });
      queryClient.invalidateQueries({ queryKey: ['scrap-names'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['scrap-yards'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  }, [isOpen, queryClient]);

  // Fetch data
  const { data: scrapCategoriesData, isLoading: scrapCategoriesLoading } = useScrapCategories({
    page: 1,
    limit: 100,
    isActive: true,
  });

  const { data: scrapNamesData, isLoading: scrapNamesLoading } = useScrapNames({
    page: 1,
    limit: 200,
    isActive: true,
  });

  const { data: customersData } = useCustomers({
    page: 1,
    limit: 100,
    status: 'ACTIVE'
  });

  const scrapCategories = useMemo(() => {
    const data = (scrapCategoriesData as any)?.data?.scrapCategories;
    return Array.isArray(data) ? data : [];
  }, [scrapCategoriesData]);

  const scrapNames = useMemo(() => {
    const data = (scrapNamesData as any)?.data?.scrapNames;
    return Array.isArray(data) ? data : [];
  }, [scrapNamesData]);

  const customers = customersData?.data?.customers || [];

  const [formData, setFormData] = useState({
    organizationId: organizationId,
    leadId: '',
    customerName: '',
    address: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    vehicleDetails: {
      type: undefined as VehicleTypeEnum | undefined,
      make: '',
      model: '',
      year: new Date().getFullYear(),
      condition: '',
      description: '',
      scrapCategoryId: '',
      scrapNameId: '',
    } as any,
    assignedCollectorId: '',
    pickupTime: undefined as Date | undefined,
    quotedPrice: undefined as number | undefined,
    actualPrice: undefined as number | undefined,
    yardId: '',
    instructions: '',
    customerId: '',
    orderStatus: 'PENDING' as OrderStatus,
    paymentStatus: 'UNPAID' as PaymentStatusEnum,
  });

  const { data: selectedCustomerData } = useCustomer(formData.customerId || '');
  const selectedCustomer = selectedCustomerData?.data;

  // Auto-fill from customer
  useEffect(() => {
    if (selectedCustomer && formData.customerId && isOpen) {
      setFormData(prev => ({
        ...prev,
        customerName: selectedCustomer.name || prev.customerName,
        address: selectedCustomer.address || prev.address,
        latitude: selectedCustomer.latitude !== undefined ? selectedCustomer.latitude : prev.latitude,
        longitude: selectedCustomer.longitude !== undefined ? selectedCustomer.longitude : prev.longitude,
        vehicleDetails: {
          ...prev.vehicleDetails,
          type: selectedCustomer.vehicleType || prev.vehicleDetails.type,
          make: selectedCustomer.vehicleMake || prev.vehicleDetails.make,
          model: selectedCustomer.vehicleModel || prev.vehicleDetails.model,
          year: selectedCustomer.vehicleYear || prev.vehicleDetails.year,
          condition: selectedCustomer.vehicleCondition || prev.vehicleDetails.condition,
        },
      }));
    }
  }, [selectedCustomer, formData.customerId, isOpen]);

  // Initialize form for edit
  useEffect(() => {
    if (order && isOpen) {
      setFormData({
        organizationId: order.organizationId || organizationId,
        leadId: order.leadId || '',
        customerName: order.customerName || '',
        address: order.address || '',
        latitude: order.latitude,
        longitude: order.longitude,
        vehicleDetails: {
          ...(order.vehicleDetails as any),
          type: (order.vehicleDetails as any)?.type as VehicleTypeEnum | undefined,
          make: order.vehicleDetails?.make || '',
          model: order.vehicleDetails?.model || '',
          year: order.vehicleDetails?.year || new Date().getFullYear(),
          condition: order.vehicleDetails?.condition || '',
          description: (order.vehicleDetails as any)?.description || '',
          scrapCategoryId: (order.vehicleDetails as any)?.scrapCategoryId || '',
          scrapNameId: (order.vehicleDetails as any)?.scrapNameId || '',
        } as any,
        assignedCollectorId: order.assignedCollectorId || '',
        pickupTime: order.pickupTime,
        quotedPrice: order.quotedPrice,
        actualPrice: order.actualPrice,
        yardId: order.yardId || '',
        instructions: (order as any).instructions || '',
        customerId: order.customerId || '',
        orderStatus: order.orderStatus || 'PENDING',
        paymentStatus: order.paymentStatus || 'UNPAID',
      });
    } else if (isOpen) {
      setFormData({
        organizationId: organizationId,
        leadId: '',
        customerName: '',
        address: '',
        latitude: undefined,
        longitude: undefined,
        vehicleDetails: { type: undefined, make: '', model: '', year: new Date().getFullYear(), condition: '', description: '', scrapCategoryId: '', scrapNameId: '' } as any,
        assignedCollectorId: '',
        pickupTime: undefined,
        quotedPrice: undefined,
        actualPrice: undefined,
        yardId: '',
        instructions: '',
        customerId: '',
        orderStatus: 'PENDING',
        paymentStatus: 'UNPAID',
      });

      setCurrentStep(1);
    }
  }, [order, isOpen, organizationId]);

  const createOrderMutation = useCreateOrder();
  const updateOrderMutation = useUpdateOrder();

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      // Validate customer info
      if (!formData.customerName.trim()) {
        toast.error('Customer name is required');
        return false;
      }

      return true;
    }

    if (step === 2) {
      // Validate location
      if (!formData.address.trim()) {
        toast.error('Collection address is required');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (shouldDispatch: boolean = false) => {


    const submitData: any = {
      organizationId: formData.organizationId,
      customerName: formData.customerName.trim(),
      address: formData.address.trim(),
      vehicleDetails: formData.vehicleDetails,
      orderStatus: formData.orderStatus,
      paymentStatus: formData.paymentStatus,
    };

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
    if (formData.instructions) submitData.instructions = formData.instructions.trim();

    try {
      if (order) {
        await updateOrderMutation.mutateAsync({
          id: order.id,
          data: submitData
        });
        toast.success('Order updated successfully!');
      } else {
        const response = await createOrderMutation.mutateAsync(submitData);
        const newOrder = (response as any)?.data || response;
        toast.success('Order created successfully!');

        if (shouldDispatch && newOrder) {
          setCreatedOrder(newOrder);
          setShowAssignmentStepper(true);
          return; // Don't close yet, will close after assignment
        }
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
  };

  const handleVehicleDetailChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      vehicleDetails: { ...prev.vehicleDetails, [field]: value }
    }));
  };

  const isLoading = createOrderMutation.isPending || updateOrderMutation.isPending;

  const steps = [
    { number: 1, title: 'Customer Info', icon: User },
    { number: 2, title: 'Location & Scrap', icon: MapPin },
    { number: 3, title: 'Details & Review', icon: CheckCircle2 },
  ];


  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:max-w-[1400px] max-h-[95vh] bg-white border-0 shadow-2xl rounded-2xl p-0 flex flex-col [&>button]:hidden text-left"
          onInteractOutside={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
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
            </div>

            {/* Stepper */}
            <div className="mt-8 flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.number;
                const isCompleted = currentStep > step.number;

                return (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                            ? 'bg-cyan-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                          }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <Icon className="h-6 w-6" />
                        )}
                      </div>
                      <p
                        className={`mt-2 text-sm font-medium ${isActive ? 'text-cyan-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                          }`}
                      >
                        {step.title}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-1 flex-1 mx-4 transition-all ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 px-8 py-6">
            <form id="order-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }}>
              {/* Step 1: Customer Information */}
              {currentStep === 1 && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="space-y-5">
                    <h3 className="text-xl font-semibold text-gray-900 border-b pb-3">Customer Information</h3>

                    <div className="space-y-2">
                      <Label htmlFor="customerId" className="text-sm font-medium text-gray-700">Select Customer</Label>
                      <Select
                        value={formData.customerId || 'none'}
                        onValueChange={(value) => {
                          if (value === 'none') {
                            handleInputChange('customerId', '');
                            handleInputChange('customerName', '');

                            handleInputChange('address', '');
                            handleInputChange('latitude', undefined);
                            handleInputChange('longitude', undefined);
                          } else {
                            handleInputChange('customerId', value);
                          }
                        }}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-cyan-600" />
                            <SelectValue placeholder="Select customer" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="none">None (New Customer)</SelectItem>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name}

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
                          className={`pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm ${formData.customerId ? 'bg-gray-50 cursor-not-allowed' : ''
                            }`}
                          placeholder="Enter customer name"
                        />
                      </div>
                    </div>


                  </div>
                </div>
              )}

              {/* Step 2: Location & Scrap Details */}
              {currentStep === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Scrap Details */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900 border-b pb-3">Scrap Details</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="scrapCategory" className="text-sm font-medium text-gray-700">Scrap Category</Label>
                        <Select
                          value={(formData.vehicleDetails as any).scrapCategoryId || 'none'}
                          onValueChange={(value) => {
                            handleVehicleDetailChange('scrapCategoryId', value === 'none' ? '' : value);
                            handleVehicleDetailChange('scrapNameId', '');
                          }}
                          disabled={isLoading || scrapCategoriesLoading}
                        >
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder={scrapCategoriesLoading ? 'Loading...' : 'Select category'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {scrapCategories.map((cat: any) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="scrapName" className="text-sm font-medium text-gray-700">Scrap Name</Label>
                        <Select
                          value={(formData.vehicleDetails as any).scrapNameId || 'none'}
                          onValueChange={(value) => handleVehicleDetailChange('scrapNameId', value === 'none' ? '' : value)}
                          disabled={isLoading || scrapNamesLoading || !(formData.vehicleDetails as any).scrapCategoryId}
                        >
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder={
                              !(formData.vehicleDetails as any).scrapCategoryId
                                ? 'Select a category first'
                                : 'Select scrap name'
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {scrapNames
                              .filter((sn: any) => {
                                const currentCategoryId = (formData.vehicleDetails as any).scrapCategoryId;
                                return currentCategoryId && sn.scrapCategoryId === currentCategoryId;
                              })
                              .map((sn: any) => (
                                <SelectItem key={sn.id} value={sn.id}>{sn.name}</SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vehicleDescription" className="text-sm font-medium text-gray-700">Description</Label>
                      <textarea
                        id="vehicleDescription"
                        value={formData.vehicleDetails.description || ''}
                        onChange={(e) => handleVehicleDetailChange('description', e.target.value)}
                        placeholder="Enter scrap description..."
                        disabled={isLoading}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border-gray-200 bg-white shadow-sm resize-none"
                      />
                    </div>
                  </div>

                  {/* Right: Location */}
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-900 border-b pb-3">Location Information</h3>

                    <div className="space-y-2">
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
                          className="pl-14 h-12 rounded-xl"
                          placeholder="Enter collection address"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <GoogleMapPicker
                        address={formData.address || ''}
                        latitude={formData.latitude || 0}
                        longitude={formData.longitude || 0}
                        onAddressChange={(address) => handleInputChange('address', address)}
                        onLocationChange={(lat, lng) => {
                          handleInputChange('latitude', lat);
                          handleInputChange('longitude', lng);
                        }}
                        showCoordinates={false}
                        mapHeight={300}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Details & Review */}
              {currentStep === 3 && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <h3 className="text-xl font-semibold text-gray-900 border-b pb-3">Additional Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="pickupTime" className="text-sm font-medium text-gray-700">Pickup Date & Time</Label>
                      <DateTimePicker
                        date={formData.pickupTime}
                        onDateChange={(date) => handleInputChange('pickupTime', date)}
                        disabled={isLoading}
                        placeholder="Select pickup date and time"
                        showTime={true}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quotedPrice" className="text-sm font-medium text-gray-700">Quoted Price ($)</Label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                          <DollarSign className="h-5 w-5 text-cyan-600" />
                        </div>
                        <Input
                          id="quotedPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.quotedPrice || ''}
                          onChange={(e) => handleInputChange('quotedPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                          disabled={isLoading}
                          className="pl-12 h-12 rounded-xl"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructions" className="text-sm font-medium text-gray-700">Order Instructions</Label>
                    <div className="relative">
                      <div className="absolute left-4 top-4">
                        <FileText className="h-5 w-5 text-cyan-600" />
                      </div>
                      <textarea
                        id="instructions"
                        value={formData.instructions}
                        onChange={(e) => handleInputChange('instructions', e.target.value)}
                        rows={4}
                        disabled={isLoading}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border-gray-200 bg-white shadow-sm resize-none"
                        placeholder="Enter any special instructions for this order..."
                      />
                    </div>
                  </div>

                  {/* Review Summary */}
                  <div className="bg-gray-50 rounded-xl p-6 mt-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Order Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Customer</p>
                        <p className="font-medium text-gray-900">{formData.customerName || '-'}</p>
                      </div>

                      <div className="md:col-span-2">
                        <p className="text-gray-600">Address</p>
                        <p className="font-medium text-gray-900">{formData.address || '-'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Scrap Category</p>
                        <p className="font-medium text-gray-900">
                          {scrapCategories.find((c: any) => c.id === (formData.vehicleDetails as any).scrapCategoryId)?.name || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Scrap Name</p>
                        <p className="font-medium text-gray-900">
                          {scrapNames.find((n: any) => n.id === (formData.vehicleDetails as any).scrapNameId)?.name || '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-6 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-12 px-6 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-all"
              >
                Cancel
              </Button>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="h-12 px-6 rounded-xl"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                  className="h-12 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white"
                >
                  Next
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              ) : (
                <>
                  <Button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={isLoading}
                    variant="outline"
                    className="btn-shine relative overflow-hidden group h-12 px-8 rounded-xl border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-600 font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all transform hover:scale-105 active:scale-95 bg-white backdrop-blur-sm"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          {order ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-5 w-5 mr-2" />
                          {order ? 'Update Order' : 'Create Order'}
                        </>
                      )}
                    </span>
                  </Button>

                  {!order && (
                    <Button
                      type="button"
                      onClick={() => handleSubmit(true)}
                      disabled={isLoading}
                      variant="outline"
                      className="btn-shine relative overflow-hidden group h-12 px-8 rounded-xl border-2 border-purple-500 text-purple-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-600 font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all transform hover:scale-105 active:scale-95 bg-white backdrop-blur-sm"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Truck className="h-5 w-5 mr-2" />
                            Create & Dispatch
                          </>
                        )}
                      </span>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assignment Stepper */}
      {createdOrder && (
        <OrderAssignmentStepper
          order={createdOrder}
          isOpen={showAssignmentStepper}
          onClose={() => {
            setShowAssignmentStepper(false);
            onClose();
          }}
          onSuccess={() => {
            setShowAssignmentStepper(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
