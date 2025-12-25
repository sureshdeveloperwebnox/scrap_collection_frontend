'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Customer, CustomerStatus, VehicleTypeEnum, VehicleConditionEnum } from '@/types';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/use-customers';
import { useVehicleTypes } from '@/hooks/use-vehicle-types';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { validatePhoneNumber, getPhonePlaceholder } from '@/lib/phone-utils';
import { CountryCode } from 'libphonenumber-js';
import { GoogleMapPicker } from '@/components/google-map-picker';
import { z } from 'zod';
import { useAuthStore } from '@/lib/store/auth-store';

interface CustomerFormProps {
    customer?: Customer;
    isOpen: boolean;
    onClose: () => void;
    onSubmit?: (customer: Partial<Customer>) => void;
    isConverting?: boolean; // Indicates if this is converting a lead to customer
    onSuccess?: (createdCustomer: Customer) => void; // Callback after successful creation
}

// Zod validation schema for customer form
const createCustomerSchema = z.object({
    organizationId: z.number().int().positive(),
    name: z.string()
        .min(2, 'Name must be at least 2 characters long')
        .max(100, 'Name cannot exceed 100 characters')
        .trim(),
    phone: z.string()
        .min(1, 'Phone number is required')
        .superRefine((val, ctx) => {
            if (!val || val.trim() === '' || val === '+') {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Phone number is required',
                });
                return;
            }
            const validation = validatePhoneNumber(val);
            if (!validation.isValid) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: validation.error || 'Please enter a valid phone number',
                });
            }
        }),
    email: z.string()
        .email('Please provide a valid email address')
        .optional()
        .or(z.literal('')),
    address: z.string()
        .min(5, 'Address must be at least 5 characters long')
        .max(500, 'Address cannot exceed 500 characters')
        .optional()
        .or(z.literal('')),
    latitude: z.number()
        .min(-90, 'Latitude must be between -90 and 90')
        .max(90, 'Latitude must be between -90 and 90')
        .optional()
        .nullable(),
    longitude: z.number()
        .min(-180, 'Longitude must be between -180 and 180')
        .max(180, 'Longitude must be between -180 and 180')
        .optional()
        .nullable(),
    vehicleType: z.enum(['CAR', 'BIKE', 'TRUCK', 'BOAT', 'VAN', 'SUV'], {
        message: 'Scrap type is required and must be one of: CAR, BIKE, TRUCK, BOAT, VAN, SUV'
    }).optional(),
    vehicleMake: z.string().max(50, 'Make cannot exceed 50 characters').optional().or(z.literal('')),
    vehicleModel: z.string().max(50, 'Model cannot exceed 50 characters').optional().or(z.literal('')),
    vehicleNumber: z.string().max(50, 'Scrap number cannot exceed 50 characters').optional().or(z.literal('')),
    vehicleYear: z.number()
        .int('Year must be an integer')
        .min(1900, 'Year must be 1900 or later')
        .max(new Date().getFullYear() + 1, `Year cannot be later than ${new Date().getFullYear() + 1}`)
        .optional()
        .nullable(),
    vehicleCondition: z.enum(['JUNK', 'DAMAGED', 'WRECKED', 'ACCIDENTAL', 'FULLY_SCRAP'], {
        message: 'Scrap condition must be one of: JUNK, DAMAGED, WRECKED, ACCIDENTAL, FULLY_SCRAP'
    }).optional(),
    accountStatus: z.enum(['ACTIVE', 'INACTIVE', 'VIP', 'BLOCKED'], {
        message: 'Account status must be ACTIVE, INACTIVE, VIP, or BLOCKED'
    }),
});

const updateCustomerSchema = createCustomerSchema.partial().extend({
    name: z.string()
        .min(2, 'Name must be at least 2 characters long')
        .max(100, 'Name cannot exceed 100 characters')
        .trim()
        .optional(),
    phone: z.string()
        .min(1, 'Phone number is required')
        .superRefine((val, ctx) => {
            if (!val || val.trim() === '' || val === '+') {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Phone number is required',
                });
                return;
            }
            const validation = validatePhoneNumber(val);
            if (!validation.isValid) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: validation.error || 'Please enter a valid phone number',
                });
            }
        })
        .optional(),
    address: z.string()
        .min(5, 'Address must be at least 5 characters long')
        .max(500, 'Address cannot exceed 500 characters')
        .optional(),
});

export function CustomerForm({ customer, isOpen, onClose, onSubmit, isConverting = false, onSuccess }: CustomerFormProps) {
    const [phoneError, setPhoneError] = useState<string | undefined>(undefined);
    const [phoneTouched, setPhoneTouched] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>('AU');
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const { user } = useAuthStore();
    const organizationId = user?.organizationId || 1;

    // Fetch vehicle types from API
    const { data: vehicleTypesData, isLoading: vehicleTypesLoading } = useVehicleTypes({
        limit: 100,
        status: undefined,
    });

    // Vehicle type enum values as array
    const VEHICLE_TYPE_VALUES = ['CAR', 'BIKE', 'TRUCK', 'BOAT', 'VAN', 'SUV'] as const;

    // Helper function to map vehicle type name to enum value
    const mapVehicleTypeNameToEnum = (name: string): VehicleTypeEnum => {
        const upperName = name.toUpperCase().trim();
        if (VEHICLE_TYPE_VALUES.includes(upperName as any)) {
            return upperName as VehicleTypeEnum;
        }
        const nameMap: Record<string, VehicleTypeEnum> = {
            'CAR': 'CAR',
            'BIKE': 'BIKE',
            'MOTORCYCLE': 'BIKE',
            'TRUCK': 'TRUCK',
            'BOAT': 'BOAT',
            'VAN': 'VAN',
            'SUV': 'SUV',
            'SPORT UTILITY VEHICLE': 'SUV',
        };
        return nameMap[upperName] || 'CAR';
    };

    // Get vehicle types from API response
    const vehicleTypes = useMemo(() => {
        const types = vehicleTypesData?.data?.vehicleTypes;
        return types || [];
    }, [vehicleTypesData?.data?.vehicleTypes?.length, vehicleTypesData?.data?.vehicleTypes?.[0]?.id]);

    const availableVehicleTypes = useMemo(() => vehicleTypes, [vehicleTypes]);

    // Helper to find vehicle type by enum value
    const findVehicleTypeByEnum = (enumValue: VehicleTypeEnum) => {
        return availableVehicleTypes.find(vt =>
            mapVehicleTypeNameToEnum(vt.name) === enumValue
        );
    };

    // Get the current vehicle type display value
    const getCurrentVehicleTypeValue = () => {
        if (!formData.vehicleType) return undefined;
        const found = findVehicleTypeByEnum(formData.vehicleType);
        return found ? mapVehicleTypeNameToEnum(found.name) : undefined;
    };

    const [formData, setFormData] = useState({
        organizationId: organizationId,
        name: '',
        phone: '',
        email: '',
        address: '',
        latitude: undefined as number | undefined,
        longitude: undefined as number | undefined,
        vehicleType: undefined as VehicleTypeEnum | undefined,
        vehicleMake: '',
        vehicleModel: '',
        vehicleNumber: '',
        vehicleYear: undefined as number | undefined,
        vehicleCondition: undefined as VehicleConditionEnum | undefined,
        accountStatus: 'ACTIVE' as CustomerStatus,
    });

    // Initialize form data when customer prop changes
    useEffect(() => {
        // Initialize form data when customer is provided (for editing) or when converting (pre-filled from lead)
        if (customer && isOpen && customer.id) {
            // Parse existing phone number (only for editing existing customer with valid ID)
            let phoneValue = customer.phone || '';

            // Validate vehicleType against API vehicle types
            let validVehicleType: VehicleTypeEnum | undefined = undefined;
            if (customer.vehicleType) {
                const found = findVehicleTypeByEnum(customer.vehicleType);
                validVehicleType = found ? mapVehicleTypeNameToEnum(found.name) : customer.vehicleType;
            }

            setFormData({
                organizationId: customer.organizationId || organizationId,
                name: customer.name || '',
                phone: phoneValue,
                email: customer.email || '',
                address: customer.address || '',
                latitude: customer.latitude,
                longitude: customer.longitude,
                vehicleType: validVehicleType,
                vehicleMake: customer.vehicleMake || '',
                vehicleModel: customer.vehicleModel || '',
                vehicleNumber: customer.vehicleNumber || '',
                vehicleYear: customer.vehicleYear,
                vehicleCondition: customer.vehicleCondition,
                accountStatus: customer.accountStatus || 'ACTIVE',
            });

            // Detect country from existing phone number
            if (phoneValue) {
                const validation = validatePhoneNumber(phoneValue);
                if (validation.country) {
                    setSelectedCountry(validation.country);
                }
            }

            setPhoneError(undefined);
            setPhoneTouched(false);
            setValidationErrors({});
        } else if ((!customer || !customer.id || isConverting) && isOpen) {
            // Initialize form for new customer or when converting from lead
            // If converting, use customer data (from lead) but treat as new customer
            const initialData = isConverting && customer ? {
                organizationId: customer.organizationId || organizationId,
                name: customer.name || '',
                phone: customer.phone || '',
                email: customer.email || '',
                address: customer.address || '',
                latitude: customer.latitude,
                longitude: customer.longitude,
                vehicleType: customer.vehicleType,
                vehicleMake: customer.vehicleMake || '',
                vehicleModel: customer.vehicleModel || '',
                vehicleNumber: customer.vehicleNumber || '',
                vehicleYear: customer.vehicleYear,
                vehicleCondition: customer.vehicleCondition,
                accountStatus: customer.accountStatus || 'ACTIVE',
            } : null;

            if (initialData) {
                // Pre-fill form with lead data when converting
                setFormData(initialData);
            } else {
                // Reset form for new customer
                const defaultVehicleType = availableVehicleTypes.length > 0
                    ? mapVehicleTypeNameToEnum(availableVehicleTypes[0].name)
                    : undefined;

                setFormData({
                    organizationId,
                    name: '',
                    phone: '',
                    email: '',
                    address: '',
                    latitude: undefined,
                    longitude: undefined,
                    vehicleType: defaultVehicleType,
                    vehicleMake: '',
                    vehicleModel: '',
                    vehicleNumber: '',
                    vehicleYear: undefined,
                    vehicleCondition: undefined,
                    accountStatus: 'ACTIVE',
                });
            }
            setPhoneError(undefined);
            setPhoneTouched(false);
            setValidationErrors({});
        }
    }, [customer, isOpen, organizationId, availableVehicleTypes.length, vehicleTypesLoading, isConverting]);

    // API mutations
    const createCustomerMutation = useCreateCustomer();
    const updateCustomerMutation = useUpdateCustomer();

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear validation error for this field when user starts typing
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
        // Clear phone error specifically
        if (field === 'phone' && phoneError) {
            setPhoneError(undefined);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous errors
        setValidationErrors({});
        setPhoneTouched(true);

        // Determine if this is a create or update operation
        // If converting or customer has no valid ID, treat as create
        const isCreateOperation = isConverting || !customer || !customer.id;

        // Validate with Zod
        const schema = isCreateOperation ? createCustomerSchema : updateCustomerSchema;
        const validationResult = schema.safeParse({
            ...formData,
            organizationId,
        });

        if (!validationResult.success) {
            // Extract field-specific errors
            const errors: Record<string, string> = {};
            validationResult.error.issues.forEach((issue) => {
                const path = issue.path[0] as string;
                if (path) {
                    errors[path] = issue.message;
                }
            });
            setValidationErrors(errors);

            // Check for phone error specifically
            const phoneIssue = validationResult.error.issues.find(issue => issue.path[0] === 'phone');
            if (phoneIssue) {
                setPhoneError(phoneIssue.message);
            }

            // Show first error in toast
            const firstError = validationResult.error.issues[0];
            if (firstError) {
                toast.error(firstError.message);
            }
            return;
        }

        // Additional phone validation
        if (formData.phone && formData.phone.trim() !== '' && formData.phone !== '+') {
            const validation = validatePhoneNumber(formData.phone.trim());
            if (!validation.isValid) {
                setPhoneError(validation.error || 'Please enter a valid phone number');
                toast.error(validation.error || 'Please enter a valid phone number');
                return;
            }
        }

        // Prepare submit data
        const submitData: any = {
            organizationId,
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            accountStatus: formData.accountStatus,
        };

        // Add optional fields only if they have values
        if (formData.email && formData.email.trim()) {
            submitData.email = formData.email.trim();
        }

        if (formData.address && formData.address.trim()) {
            submitData.address = formData.address.trim();
        }

        // Save latitude if it's a valid number
        if (formData.latitude !== undefined && formData.latitude !== null && !isNaN(formData.latitude)) {
            if (!(formData.latitude === 0 && formData.longitude === 0)) {
                submitData.latitude = formData.latitude;
            }
        }

        // Save longitude if it's a valid number
        if (formData.longitude !== undefined && formData.longitude !== null && !isNaN(formData.longitude)) {
            if (!(formData.latitude === 0 && formData.longitude === 0)) {
                submitData.longitude = formData.longitude;
            }
        }

        // Add vehicle fields
        if (formData.vehicleType) {
            submitData.vehicleType = formData.vehicleType;
        }
        if (formData.vehicleMake && formData.vehicleMake.trim()) {
            submitData.vehicleMake = formData.vehicleMake.trim();
        }
        if (formData.vehicleModel && formData.vehicleModel.trim()) {
            submitData.vehicleModel = formData.vehicleModel.trim();
        }
        if (formData.vehicleNumber && formData.vehicleNumber.trim()) {
            submitData.vehicleNumber = formData.vehicleNumber.trim();
        }
        if (formData.vehicleYear !== undefined && formData.vehicleYear !== null) {
            submitData.vehicleYear = formData.vehicleYear;
        }
        if (formData.vehicleCondition) {
            submitData.vehicleCondition = formData.vehicleCondition;
        }

        try {
            if (isCreateOperation) {
                // Create new customer (including when converting from lead)
                const response = await createCustomerMutation.mutateAsync(submitData);
                const createdCustomer = (response as any)?.data || (response as unknown as Customer);

                // Only show toast if onSuccess callback is not provided (let parent handle it)
                if (!onSuccess) {
                    toast.success(isConverting ? 'Customer converted successfully!' : 'Customer created successfully!');
                }

                // Call onSuccess callback if provided (for navigation/highlighting)
                if (onSuccess && createdCustomer) {
                    onSuccess(createdCustomer);
                }
            } else {
                // Update existing customer (only when customer has valid ID and not converting)
                await updateCustomerMutation.mutateAsync({
                    id: customer!.id,
                    data: submitData
                });
                toast.success('Customer updated successfully!');
            }

            if (onSubmit) {
                onSubmit(submitData);
            }

            onClose();
        } catch (error: any) {
            console.error('Error saving customer:', error);
            const errorMessage = error?.response?.data?.message || error?.message || (customer ? 'Failed to update customer' : 'Failed to create customer');
            toast.error(errorMessage);

            // Set validation errors from API response if available
            if (error?.response?.data?.validationErrors) {
                const apiErrors: Record<string, string> = {};
                error.response.data.validationErrors.forEach((err: any) => {
                    if (err.path && err.path.length > 0) {
                        apiErrors[err.path[0]] = err.message || 'Validation error';
                    }
                });
                setValidationErrors(apiErrors);
            }
        }
    };

    const isLoading = createCustomerMutation.isPending || updateCustomerMutation.isPending;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:max-w-[1400px] max-h-[95vh] bg-white border-0 shadow-2xl rounded-2xl p-0 flex flex-col [&>button]:hidden text-left"
                onInteractOutside={(e) => {
                    // Prevent closing when clicking outside the dialog
                    e.preventDefault();
                }}
                onPointerDownOutside={(e) => {
                    // Prevent closing when clicking outside the dialog
                    e.preventDefault();
                }}
            >
                <DialogHeader className="px-4 sm:px-6 lg:px-8 pt-8 pb-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-3xl font-bold text-gray-900">
                                {isConverting ? 'Convert Customer' : customer ? 'Edit Customer' : 'Create Customer'}
                            </DialogTitle>
                            <p className="text-sm text-gray-600 mt-2">
                                {isConverting ? 'Review and complete customer details from lead' : customer ? 'Update customer information' : 'Fill in the details to create a new customer'}
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
                                form="customer-form"
                                disabled={isLoading}
                                variant="outline"
                                className="relative overflow-hidden group h-12 px-8 rounded-xl border-2 border-cyan-500 text-cyan-600 hover:bg-white hover:text-cyan-700 hover:border-cyan-400 font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all transform hover:scale-105 active:scale-95 bg-white backdrop-blur-sm"
                            >
                                <span className="absolute inset-0 w-full h-full -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent z-0 skew-x-12" />
                                <span className="relative z-10 flex items-center gap-2">
                                    {isLoading ? (
                                        <>
                                            <div className="mr-2 h-5 w-5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                                            {isConverting ? 'Converting...' : customer ? 'Updating...' : 'Creating...'}
                                        </>
                                    ) : (
                                        isConverting ? 'Convert Customer' : customer ? 'Update Customer' : 'Create Customer'
                                    )}
                                </span>
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto min-h-0">
                    <form id="customer-form" onSubmit={handleSubmit} className="px-4 sm:px-6 lg:px-8 pb-8 space-y-6">
                        {/* Main Two-Column Layout for Landscape Form */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                            {/* Left Column */}
                            <div className="space-y-6">
                                {/* Customer Information */}
                                <div className="space-y-5">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Customer Information</h3>
                                    <div className="grid grid-cols-1 gap-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Name *</Label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-cyan-600" />
                                                    </div>
                                                </div>
                                                <Input
                                                    id="name"
                                                    value={formData.name}
                                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                                    required
                                                    disabled={isLoading}
                                                    className={`pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                                                        }`}
                                                    placeholder="Enter customer name"
                                                />
                                            </div>
                                            {validationErrors.name && (
                                                <p className="text-sm text-red-600 mt-1">{validationErrors.name}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone *</Label>
                                            <div className="flex flex-col gap-2">
                                                <PhoneInput
                                                    country={selectedCountry.toLowerCase()}
                                                    value={formData.phone?.replace(/^\+/, '') || ''}
                                                    preferredCountries={['au', 'us', 'gb', 'in', 'nz', 'ca']}
                                                    disableCountryGuess={false}
                                                    disableDropdown={false}
                                                    onChange={(value, countryData: any) => {
                                                        if (countryData && countryData.iso2) {
                                                            const isoCode = countryData.iso2.toUpperCase() as CountryCode;
                                                            setSelectedCountry(isoCode);
                                                        }

                                                        const phoneWithPlus = value.startsWith('+') ? value : `+${value}`;
                                                        handleInputChange('phone', phoneWithPlus);

                                                        if (phoneError) {
                                                            setPhoneError(undefined);
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        setPhoneTouched(true);
                                                        if (formData.phone && formData.phone.trim() !== '' && formData.phone !== '+') {
                                                            const validation = validatePhoneNumber(formData.phone, selectedCountry);
                                                            if (!validation.isValid) {
                                                                setPhoneError(validation.error);
                                                            } else {
                                                                setPhoneError(undefined);
                                                                if (validation.formatted) {
                                                                    handleInputChange('phone', validation.formatted);
                                                                }
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
                                                    inputClass={`!w-full !h-12 !rounded-xl !border-gray-200 !bg-white !shadow-sm focus:!border-cyan-400 focus:!ring-cyan-200 focus:!ring-2 transition-all ${phoneError && phoneTouched ? '!border-red-500 focus:!border-red-500 focus:!ring-red-200' : ''
                                                        }`}
                                                    buttonClass={`!border-gray-200 !rounded-l-xl ${phoneError && phoneTouched ? '!border-red-500' : ''}`}
                                                    containerClass={`!w-full ${phoneError && phoneTouched ? 'error' : ''}`}
                                                    disabled={isLoading}
                                                    placeholder={getPhonePlaceholder(selectedCountry)}
                                                    specialLabel=""
                                                />
                                                {phoneError && phoneTouched && (
                                                    <p className="text-sm text-red-600 mt-1">{phoneError}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
                                            <div className="relative">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                                                        <Mail className="h-5 w-5 text-cyan-600" />
                                                    </div>
                                                </div>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                                    disabled={isLoading}
                                                    className={`pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                                                        }`}
                                                    placeholder="Enter email address"
                                                />
                                            </div>
                                            {validationErrors.email && (
                                                <p className="text-sm text-red-600 mt-1">{validationErrors.email}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="accountStatus" className="text-sm font-medium text-gray-700">Account Status *</Label>
                                            <Select
                                                value={formData.accountStatus}
                                                onValueChange={(value) => handleInputChange('accountStatus', value as CustomerStatus)}
                                                disabled={isLoading}
                                            >
                                                <SelectTrigger className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.accountStatus ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                                                    }`}>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ACTIVE">Active</SelectItem>
                                                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                                                    <SelectItem value="VIP">VIP</SelectItem>
                                                    <SelectItem value="BLOCKED">Blocked</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {validationErrors.accountStatus && (
                                                <p className="text-sm text-red-600 mt-1">{validationErrors.accountStatus}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6 lg:sticky lg:top-4">
                                {/* Scrap Details */}
                                <div className="space-y-5">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Scrap Details</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="vehicleType" className="text-sm font-medium text-gray-700">Scrap Type</Label>
                                            <Select
                                                value={getCurrentVehicleTypeValue()}
                                                onValueChange={(value) => {
                                                    const selectedVehicleType = availableVehicleTypes.find(vt =>
                                                        mapVehicleTypeNameToEnum(vt.name) === value
                                                    );
                                                    const enumValue = selectedVehicleType
                                                        ? mapVehicleTypeNameToEnum(selectedVehicleType.name)
                                                        : (value as VehicleTypeEnum);
                                                    handleInputChange('vehicleType', enumValue);
                                                }}
                                                disabled={isLoading || vehicleTypesLoading || availableVehicleTypes.length === 0}
                                            >
                                                <SelectTrigger className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.vehicleType ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                                                    }`}>
                                                    <SelectValue placeholder={
                                                        vehicleTypesLoading
                                                            ? "Loading vehicle types..."
                                                            : availableVehicleTypes.length === 0
                                                                ? "No vehicle types available"
                                                                : "Select vehicle type"
                                                    } />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {vehicleTypesLoading ? (
                                                        <div className="px-2 py-1.5 text-sm text-gray-500">Loading vehicle types...</div>
                                                    ) : availableVehicleTypes.length === 0 ? (
                                                        <div className="px-2 py-1.5 text-sm text-gray-500">No vehicle types available</div>
                                                    ) : (
                                                        availableVehicleTypes.map((vehicleType) => {
                                                            const enumValue = mapVehicleTypeNameToEnum(vehicleType.name);
                                                            const key = vehicleType.id ? String(vehicleType.id) : String(vehicleType.name);
                                                            return (
                                                                <SelectItem key={key} value={enumValue}>
                                                                    {String(vehicleType.name)}
                                                                </SelectItem>
                                                            );
                                                        })
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {validationErrors.vehicleType && (
                                                <p className="text-sm text-red-600 mt-1">{validationErrors.vehicleType}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="vehicleCondition" className="text-sm font-medium text-gray-700">Scrap Condition</Label>
                                            <Select
                                                value={formData.vehicleCondition || ''}
                                                onValueChange={(value) => handleInputChange('vehicleCondition', value as VehicleConditionEnum)}
                                                disabled={isLoading}
                                            >
                                                <SelectTrigger className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.vehicleCondition ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                                                    }`}>
                                                    <SelectValue placeholder="Select condition" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="JUNK">Junk</SelectItem>
                                                    <SelectItem value="DAMAGED">Damaged</SelectItem>
                                                    <SelectItem value="WRECKED">Wrecked</SelectItem>
                                                    <SelectItem value="ACCIDENTAL">Accidental</SelectItem>
                                                    <SelectItem value="FULLY_SCRAP">Fully Scrap</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {validationErrors.vehicleCondition && (
                                                <p className="text-sm text-red-600 mt-1">{validationErrors.vehicleCondition}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="vehicleMake" className="text-sm font-medium text-gray-700">Scrap Make</Label>
                                            <Input
                                                id="vehicleMake"
                                                value={formData.vehicleMake}
                                                onChange={(e) => handleInputChange('vehicleMake', e.target.value)}
                                                placeholder="e.g., Toyota"
                                                disabled={isLoading}
                                                className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.vehicleMake ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                                                    }`}
                                            />
                                            {validationErrors.vehicleMake && (
                                                <p className="text-sm text-red-600 mt-1">{validationErrors.vehicleMake}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="vehicleModel" className="text-sm font-medium text-gray-700">Model</Label>
                                            <Input
                                                id="vehicleModel"
                                                value={formData.vehicleModel}
                                                onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                                                placeholder="e.g., Corolla"
                                                disabled={isLoading}
                                                className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.vehicleModel ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                                                    }`}
                                            />
                                            {validationErrors.vehicleModel && (
                                                <p className="text-sm text-red-600 mt-1">{validationErrors.vehicleModel}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="vehicleNumber" className="text-sm font-medium text-gray-700">Scrap Number</Label>
                                            <Input
                                                id="vehicleNumber"
                                                value={formData.vehicleNumber}
                                                onChange={(e) => handleInputChange('vehicleNumber', e.target.value)}
                                                placeholder="e.g., ABC-1234"
                                                disabled={isLoading}
                                                className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.vehicleNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                                                    }`}
                                            />
                                            {validationErrors.vehicleNumber && (
                                                <p className="text-sm text-red-600 mt-1">{validationErrors.vehicleNumber}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="vehicleYear" className="text-sm font-medium text-gray-700">Scrap Year</Label>
                                            <Select
                                                value={formData.vehicleYear?.toString() || ''}
                                                onValueChange={(value) => handleInputChange('vehicleYear', parseInt(value) || undefined)}
                                                disabled={isLoading}
                                            >
                                                <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-5 w-5 text-cyan-600" />
                                                        <SelectValue placeholder="Select year">
                                                            {formData.vehicleYear || 'Select year'}
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
                                    </div>
                                </div>

                                {/* Location Information */}
                                <div className="space-y-5 w-full">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location Information</h3>
                                    <div className="space-y-5 w-full">
                                        {/* Google Map Picker - Only location, no separate address field (GoogleMapPicker has its own label) */}
                                        <div className="space-y-2 w-full">
                                            <GoogleMapPicker
                                                address={formData.address || ''}
                                                latitude={formData.latitude || 0}
                                                longitude={formData.longitude || 0}
                                                onAddressChange={(address) => {
                                                    handleInputChange('address', address);
                                                    console.log('Address changed:', address);
                                                }}
                                                onLocationChange={(lat, lng) => {
                                                    console.log('Location changed:', { lat, lng });
                                                    handleInputChange('latitude', lat);
                                                    handleInputChange('longitude', lng);
                                                }}
                                                showCoordinates={false}
                                                mapHeight={350}
                                            />
                                            {validationErrors.address && (
                                                <p className="text-sm text-red-600 mt-1">{validationErrors.address}</p>
                                            )}
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
