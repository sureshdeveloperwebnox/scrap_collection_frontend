'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Lead, VehicleTypeEnum, VehicleConditionEnum, LeadSourceEnum, LeadStatus } from '@/types';
import { useCreateLead, useUpdateLead } from '@/hooks/use-leads';
import { useVehicleTypes } from '@/hooks/use-vehicle-types';
import { toast } from 'sonner';
import { Upload, X, User, Mail, Phone, MapPin, Car, Calendar, FileText, Image as ImageIcon } from 'lucide-react';
import { ImageUpload } from '@/components/ui/image-upload';
import { normalizeImagePaths } from '@/utils/image-utils';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { isValidPhoneNumber, parsePhoneNumber, CountryCode } from 'libphonenumber-js';

interface LeadFormProps {
  lead?: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (lead: Partial<Lead>) => void;
}

// Vehicle type enum values as array (constant, defined outside component)
const VEHICLE_TYPE_VALUES = ['CAR', 'BIKE', 'TRUCK', 'BOAT', 'VAN', 'SUV'] as const;

export function LeadForm({ lead, isOpen, onClose, onSubmit }: LeadFormProps) {
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const initializedRef = useRef<string | null>(null); // Track initialization to prevent infinite loops

  // Fetch vehicle types from API - fetch all (both active and inactive) to ensure vehicle types are available
  const { data: vehicleTypesData, isLoading: vehicleTypesLoading } = useVehicleTypes({
    limit: 100, // Get all vehicle types
    status: undefined, // Fetch all vehicle types (both active and inactive)
  });

  // Helper function to map vehicle type name to enum value
  const mapVehicleTypeNameToEnum = (name: string): VehicleTypeEnum => {
    const upperName = name.toUpperCase().trim();
    // Direct mapping
    if (VEHICLE_TYPE_VALUES.includes(upperName as any)) {
      return upperName as VehicleTypeEnum;
    }
    // Common name variations
    const nameMap: Record<string, VehicleTypeEnum> = {
      'CAR': 'CAR',
      'AUTO': 'CAR',
      'AUTOMOBILE': 'CAR',
      'BIKE': 'BIKE',
      'MOTORCYCLE': 'BIKE',
      'MOTORBIKE': 'BIKE',
      'TRUCK': 'TRUCK',
      'BOAT': 'BOAT',
      'VAN': 'VAN',
      'SUV': 'SUV',
      'SPORT UTILITY VEHICLE': 'SUV',
    };
    return nameMap[upperName] || 'CAR'; // Default to CAR if not found
  };

  // Get vehicle types from API response - API ONLY, no fallback - memoized to prevent infinite loops
  const vehicleTypes = useMemo(() => {
    const types = vehicleTypesData?.data?.vehicleTypes;
    return types && Array.isArray(types) ? types : [];
  }, [vehicleTypesData?.data?.vehicleTypes?.length, vehicleTypesData?.data?.vehicleTypes?.[0]?.id]);
  
  // Use all vehicle types from API (both active and inactive) - memoized to prevent infinite loops
  // This ensures vehicle types are available even if they're marked as inactive
  const availableVehicleTypes = useMemo(() => 
    vehicleTypes, // Show all vehicle types, not just active ones
    [vehicleTypes]
  );

  // Helper to find vehicle type by enum value (for editing)
  const findVehicleTypeByEnum = (enumValue: VehicleTypeEnum) => {
    return availableVehicleTypes.find(vt => 
      mapVehicleTypeNameToEnum(vt.name) === enumValue
    );
  };

  // Get the current vehicle type display value (for Select component) - API based only
  const getCurrentVehicleTypeValue = () => {
    if (!formData.vehicleType) return undefined;
    const found = findVehicleTypeByEnum(formData.vehicleType);
    // Only return value if found in API vehicle types
    return found ? mapVehicleTypeNameToEnum(found.name) : undefined;
  };
  
  const [formData, setFormData] = useState({
    organizationId: 1,
    fullName: '',
    phone: '', // Full phone number with country code (e.g., +61491570159)
    email: '',
    vehicleType: 'CAR' as VehicleTypeEnum,
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear(),
    vehicleCondition: 'JUNK' as VehicleConditionEnum,
    locationAddress: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    leadSource: 'MANUAL' as LeadSourceEnum,
    photos: [] as string[],
    notes: '',
    status: 'NEW' as LeadStatus,
    customerId: undefined as string | undefined,
  });

  // Initialize form data when lead prop changes or when vehicle types load - API based only
  useEffect(() => {
    // Only run when dialog opens
    if (!isOpen) {
      initializedRef.current = null; // Reset when dialog closes
      return;
    }
    
    // Create a unique key for this initialization
    const initKey = `${lead?.id || 'new'}-${availableVehicleTypes.length}`;
    
    // Skip if already initialized for this combination
    if (initializedRef.current === initKey) {
      return;
    }
    
    // Mark as initialized
    initializedRef.current = initKey;
    
    if (lead) {
      // Validate vehicleType against API vehicle types - API based only
      let validVehicleType: VehicleTypeEnum | undefined = undefined;
      if (lead.vehicleType) {
        const found = findVehicleTypeByEnum(lead.vehicleType);
        validVehicleType = found ? mapVehicleTypeNameToEnum(found.name) : undefined;
      }
      
      // If no valid vehicle type found, use first available from API
      if (!validVehicleType && availableVehicleTypes.length > 0) {
        validVehicleType = mapVehicleTypeNameToEnum(availableVehicleTypes[0].name);
      }
      
      // Normalize photo paths (convert full URLs to relative paths if needed)
      const normalizedPhotos = normalizeImagePaths(lead.photos || []);
      
      setFormData(prev => {
        // Only update if values actually changed to prevent infinite loops
        const hasChanges = 
          prev.organizationId !== (lead.organizationId || 1) ||
          prev.fullName !== (lead.fullName || '') ||
          prev.phone !== (lead.phone || '') ||
          prev.email !== (lead.email || '') ||
          prev.vehicleType !== (validVehicleType || 'CAR') ||
          prev.vehicleMake !== (lead.vehicleMake || '') ||
          prev.vehicleModel !== (lead.vehicleModel || '') ||
          prev.vehicleYear !== (lead.vehicleYear || new Date().getFullYear()) ||
          prev.vehicleCondition !== (lead.vehicleCondition || 'JUNK') ||
          prev.locationAddress !== (lead.locationAddress || '') ||
          prev.leadSource !== (lead.leadSource || 'MANUAL') ||
          prev.status !== (lead.status || 'NEW') ||
          prev.customerId !== lead.customerId;
        
        if (!hasChanges && JSON.stringify(prev.photos) === JSON.stringify(normalizedPhotos)) {
          return prev; // No changes, return previous state
        }
        
        return {
        ...prev,
        organizationId: lead.organizationId || 1,
        fullName: lead.fullName || '',
          phone: lead.phone || '',
        email: lead.email || '',
          vehicleType: validVehicleType || 'CAR',
        vehicleMake: lead.vehicleMake || '',
        vehicleModel: lead.vehicleModel || '',
        vehicleYear: lead.vehicleYear || new Date().getFullYear(),
        vehicleCondition: lead.vehicleCondition || 'JUNK',
        locationAddress: lead.locationAddress || '',
        latitude: lead.latitude,
        longitude: lead.longitude,
        leadSource: lead.leadSource || 'MANUAL',
          photos: normalizedPhotos,
        notes: lead.notes || '',
        status: lead.status || 'NEW',
        customerId: lead.customerId,
        };
      });
      setPhoneError(undefined);
      setPhoneTouched(false);
    } else {
      // Reset form for new lead - use first available vehicle type from API
      const defaultVehicleType = availableVehicleTypes.length > 0
        ? mapVehicleTypeNameToEnum(availableVehicleTypes[0].name)
        : 'CAR';
      
      setFormData(prev => {
        // Only reset if form is not already in default state
        if (prev.fullName === '' && prev.phone === '' && prev.email === '' && prev.vehicleType === defaultVehicleType) {
          return prev; // Already in default state
        }
        
        return {
        organizationId: 1,
        fullName: '',
          phone: '',
        email: '',
          vehicleType: defaultVehicleType,
        vehicleMake: '',
        vehicleModel: '',
        vehicleYear: new Date().getFullYear(),
        vehicleCondition: 'JUNK',
        locationAddress: '',
        latitude: undefined,
        longitude: undefined,
        leadSource: 'MANUAL',
        photos: [],
        notes: '',
        status: 'NEW',
        customerId: undefined,
        };
      });
      setPhoneError(undefined);
      setPhoneTouched(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id, isOpen, availableVehicleTypes.length, vehicleTypesLoading]); // Include vehicleTypesLoading to wait for data

  // API mutations
  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number before submit
    setPhoneTouched(true);
    
    // Validate that fullName is present and not empty
    if (!formData.fullName || formData.fullName.trim() === '') {
      toast.error('Full name is required');
      return;
    }
    
    // Validate that phone is present
    if (!formData.phone || formData.phone.trim() === '' || formData.phone === '+') {
      toast.error('Phone number is required');
      setPhoneError('Phone number is required');
      return;
    }
    
    // Validate phone number format using libphonenumber-js
    const phoneToValidate = formData.phone.trim();
    
    // Try to parse the phone number to get country context
    let isValid = false;
    let validationError = 'Please enter a valid phone number';
    
    try {
      const parsed = parsePhoneNumber(phoneToValidate);
      if (parsed && parsed.country) {
        const countryCode = parsed.country.toUpperCase() as CountryCode;
        isValid = isValidPhoneNumber(phoneToValidate, countryCode);
        
        if (!isValid) {
          // Check if number might be valid but in different format
          // Some numbers might be valid but libphonenumber-js is strict
          const nationalNumber = parsed.nationalNumber;
          if (nationalNumber && nationalNumber.length >= 7 && nationalNumber.length <= 15) {
            // Number has reasonable format, might be acceptable
            // Try to format it and see if it's close to valid
            try {
              // If we can parse it, it's likely valid even if strict validation fails
              isValid = true; // Be more lenient - if it parses, accept it
            } catch (e) {
              validationError = `Please enter a valid ${parsed.country.toUpperCase()} phone number. Expected format: ${parsed.countryCallingCode} XXXX XXXX`;
            }
          } else {
            validationError = `Please enter a valid ${parsed.country.toUpperCase()} phone number`;
          }
        }
      } else {
        // If parsing doesn't give us a country, try generic validation
        isValid = isValidPhoneNumber(phoneToValidate);
        if (!isValid) {
          // Check if it's at least a reasonable length
          const digitsOnly = phoneToValidate.replace(/\D/g, '');
          if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
            // Reasonable length, might be valid - allow it
            isValid = true;
          }
        }
      }
    } catch (error) {
      // If parsing fails, try generic validation
      isValid = isValidPhoneNumber(phoneToValidate);
      if (!isValid) {
        // Check if it's at least a reasonable length
        const digitsOnly = phoneToValidate.replace(/\D/g, '');
        if (digitsOnly.length >= 10 && digitsOnly.length <= 15 && phoneToValidate.startsWith('+')) {
          // Has country code and reasonable length, might be valid
          isValid = true;
        }
      }
    }
    
    if (!isValid) {
      setPhoneError(validationError);
      toast.error(validationError);
      return;
    }
    
    setPhoneError(undefined);
    
    try {
      if (lead) {
        // Update existing lead - always include fullName and phone from formData
        // Build update data - always include fullName and phone
        const updateData: any = {
          fullName: formData.fullName.trim(), // Always include fullName, trim whitespace
          phone: formData.phone.trim(), // Always include phone with country code from react-phone-input-2
        };
        
        console.log('Update lead - formData.fullName:', formData.fullName);
        console.log('Update lead - formData.phone:', formData.phone);
        console.log('Update lead - updateData (before optional):', updateData);
        
        // Include optional fields if they exist in formData
        if (formData.email !== undefined && formData.email !== null && formData.email.trim() !== '') {
          updateData.email = formData.email.trim();
        }
        // Always include vehicleType - it's required
        if (formData.vehicleType) {
          updateData.vehicleType = formData.vehicleType;
        } else {
          // If vehicleType is missing, use the lead's existing vehicleType
          updateData.vehicleType = lead.vehicleType || 'CAR';
        }
        if (formData.vehicleMake !== undefined && formData.vehicleMake !== null) {
          updateData.vehicleMake = formData.vehicleMake;
        }
        if (formData.vehicleModel !== undefined && formData.vehicleModel !== null) {
          updateData.vehicleModel = formData.vehicleModel;
        }
        if (formData.vehicleYear !== undefined && formData.vehicleYear !== null) {
          updateData.vehicleYear = formData.vehicleYear;
        }
        if (formData.vehicleCondition !== undefined) {
          updateData.vehicleCondition = formData.vehicleCondition;
        }
        if (formData.locationAddress !== undefined && formData.locationAddress !== null) {
          updateData.locationAddress = formData.locationAddress;
        }
        if (formData.latitude !== undefined && formData.latitude !== null) {
          updateData.latitude = formData.latitude;
        }
        if (formData.longitude !== undefined && formData.longitude !== null) {
          updateData.longitude = formData.longitude;
        }
        if (formData.leadSource !== undefined) {
          updateData.leadSource = formData.leadSource;
        }
        if (formData.photos !== undefined) {
          updateData.photos = formData.photos;
        }
        if (formData.notes !== undefined && formData.notes !== null) {
          updateData.notes = formData.notes;
        }
        if (formData.status !== undefined) {
          updateData.status = formData.status;
        }
        
        console.log('Updating lead - formData:', formData);
        console.log('Updating lead - updateData:', updateData);
        
        const result = await updateLeadMutation.mutateAsync({
          id: lead.id,
          data: updateData
        });
        
        console.log('Update result:', result);
        
        if (onSubmit) {
          onSubmit(updateData);
        }
        
        toast.success('Lead updated successfully!');
      } else {
        // Create new lead - include all required fields
        const submitData: any = {
          organizationId: formData.organizationId,
          fullName: formData.fullName.trim(), // Ensure fullName is included and trimmed
          phone: formData.phone.trim(), // Phone with country code from react-phone-input-2
          email: formData.email,
          vehicleType: formData.vehicleType,
          vehicleMake: formData.vehicleMake,
          vehicleModel: formData.vehicleModel,
          vehicleYear: formData.vehicleYear,
          vehicleCondition: formData.vehicleCondition,
          locationAddress: formData.locationAddress,
          latitude: formData.latitude,
          longitude: formData.longitude,
          leadSource: formData.leadSource,
          photos: formData.photos,
          notes: formData.notes,
        };
        
        // Only include customerId if it exists
        if (formData.customerId) {
          submitData.customerId = formData.customerId;
        }
        
        console.log('Creating lead with data:', submitData);
        
        await createLeadMutation.mutateAsync(submitData);
        
        if (onSubmit) {
          onSubmit(submitData);
        }
        
        toast.success('Lead created successfully!');
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error saving lead:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred';
      toast.error(lead ? `Failed to update lead: ${errorMessage}` : `Failed to create lead: ${errorMessage}`);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotosChange = (urls: string[]) => {
    setFormData(prev => ({ ...prev, photos: urls }));
  };

  const isLoading = createLeadMutation.isPending || updateLeadMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="w-[95vw] sm:max-w-[800px] max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl rounded-2xl p-0"
        onInteractOutside={(e) => {
          // Prevent closing when clicking outside the dialog (backdrop/empty spaces)
          e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking outside the dialog
          e.preventDefault();
        }}
      >
        <DialogHeader className="px-8 pt-8 pb-6">
          <DialogTitle className="text-3xl font-bold text-gray-900">
            {lead ? 'Edit Lead' : 'Create Lead'}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            {lead ? 'Update lead information' : 'Fill in the details to create a new lead'}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
          {/* Customer Information */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name *</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-cyan-600" />
                    </div>
                  </div>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                  disabled={isLoading}
                    className="pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
                    placeholder="Enter full name"
                />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone *</Label>
                <div className="flex flex-col gap-2">
                  <PhoneInput
                    country={(() => {
                      // Detect country from existing phone number when editing
                      if (lead && formData.phone) {
                        try {
                          const phoneNumber = formData.phone.startsWith('+') ? formData.phone : `+${formData.phone}`;
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
                    value={formData.phone?.replace(/^\+/, '') || ''} // Remove + prefix for react-phone-input-2 (it adds it automatically)
                    preferredCountries={['au', 'us', 'gb', 'in', 'nz', 'ca']} // Preferred countries
                    disableCountryGuess={true} // Prevent automatic country switching
                    disableDropdown={false} // Allow manual country selection
                    onChange={(value, country, e, formattedValue) => {
                      // value from react-phone-input-2 includes country code but without +
                      // Add + prefix for storage
                      const phoneWithPlus = value ? `+${value}` : '';
                      handleInputChange('phone', phoneWithPlus);
                      
                      // Clear error when user starts typing (don't validate while typing)
                      // This prevents showing errors while the user is still entering the number
                      if (phoneError) {
                        setPhoneError(undefined);
                      }
                    }}
                    onBlur={() => {
                      setPhoneTouched(true);
                      if (formData.phone && formData.phone.trim() !== '' && formData.phone !== '+') {
                        // Try to parse and validate with country context for better accuracy
                        try {
                          const parsed = parsePhoneNumber(formData.phone);
                          if (parsed && parsed.country) {
                            const countryCode = parsed.country.toUpperCase() as CountryCode;
                            const isValid = isValidPhoneNumber(formData.phone, countryCode);
                            
                            if (!isValid) {
                              // Check if it's a possible valid number (might be valid but not recognized)
                              // Try to be more lenient - if it has country code and reasonable length, allow it
                              const nationalNumber = parsed.nationalNumber;
                              if (nationalNumber && nationalNumber.length >= 7 && nationalNumber.length <= 15) {
                                // Number has reasonable length, might be valid - clear error
                                // Final validation will happen on submit
                                setPhoneError(undefined);
                              } else {
                                // Provide more helpful error message with country context
                                setPhoneError(`Please enter a valid ${parsed.country.toUpperCase()} phone number`);
                              }
                            } else {
                              setPhoneError(undefined);
                            }
                          } else {
                            // If parsing doesn't give us a country, try generic validation
                            // Be more lenient - if it has + and reasonable length, allow it
                            const digitsOnly = formData.phone.replace(/\D/g, '');
                            if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
                              // Reasonable length, might be valid
                              setPhoneError(undefined);
                            } else {
                              const isValid = isValidPhoneNumber(formData.phone);
                              setPhoneError(isValid ? undefined : 'Please enter a valid phone number');
                            }
                          }
                        } catch (error) {
                          // If parsing fails completely, be lenient if number looks reasonable
                          const digitsOnly = formData.phone.replace(/\D/g, '');
                          if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
                            // Reasonable length, allow it - final validation on submit
                            setPhoneError(undefined);
                          } else {
                            const isValid = isValidPhoneNumber(formData.phone);
                            setPhoneError(isValid ? undefined : 'Please enter a valid phone number');
                          }
                        }
                      } else {
                        setPhoneError('Phone number is required');
                      }
                    }}
                    // Country code will appear inside the input field by default
                    disableCountryCode={false} // Include country code in the value
                    inputProps={{
                      required: true,
                      autoComplete: 'tel'
                    }}
                    inputClass={`!w-full !h-12 !rounded-xl !border-gray-200 !bg-white !shadow-sm focus:!border-cyan-400 focus:!ring-cyan-200 focus:!ring-2 transition-all ${
                      phoneError && phoneTouched ? '!border-red-500 focus:!border-red-500 focus:!ring-red-200' : ''
                    }`}
                    buttonClass={`!border-gray-200 !rounded-l-xl ${phoneError && phoneTouched ? '!border-red-500' : ''}`}
                    containerClass={`!w-full ${phoneError && phoneTouched ? 'error' : ''}`}
                    disabled={isLoading}
                    placeholder="Enter phone number"
                    specialLabel=""
                  />
                  {phoneError && phoneTouched && (
                    <p className="text-sm text-red-600 mt-1">{phoneError}</p>
                  )}
                </div>
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
                  className="pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
                  placeholder="Enter email address"
              />
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900">Vehicle Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="vehicleType" className="text-sm font-medium text-gray-700">Vehicle Type *</Label>
                <Select 
                    value={getCurrentVehicleTypeValue()} 
                  onValueChange={(value) => {
                      // Find the vehicle type that matches the selected enum value
                    const selectedVehicleType = availableVehicleTypes.find(vt => 
                        mapVehicleTypeNameToEnum(vt.name) === value
                    );
                      
                      // Map the API vehicle type name to enum value for storage
                    const enumValue = selectedVehicleType 
                      ? mapVehicleTypeNameToEnum(selectedVehicleType.name)
                      : (value as VehicleTypeEnum);
                      
                    handleInputChange('vehicleType', enumValue);
                  }}
                    disabled={isLoading || vehicleTypesLoading || availableVehicleTypes.length === 0}
                >
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all">
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleCondition" className="text-sm font-medium text-gray-700">Condition *</Label>
                <Select 
                  value={formData.vehicleCondition}
                  onValueChange={(value) => handleInputChange('vehicleCondition', value as VehicleConditionEnum)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all">
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
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="vehicleMake" className="text-sm font-medium text-gray-700">Make</Label>
                <Input
                  id="vehicleMake"
                  value={formData.vehicleMake}
                  onChange={(e) => handleInputChange('vehicleMake', e.target.value)}
                  placeholder="e.g., Toyota"
                  disabled={isLoading}
                  className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleModel" className="text-sm font-medium text-gray-700">Model</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                  placeholder="e.g., Corolla"
                  disabled={isLoading}
                  className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleYear" className="text-sm font-medium text-gray-700">Year</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-cyan-600" />
                    </div>
                  </div>
                <Input
                  id="vehicleYear"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.vehicleYear}
                  onChange={(e) => handleInputChange('vehicleYear', parseInt(e.target.value) || new Date().getFullYear())}
                  disabled={isLoading}
                    className="pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
                    placeholder="Year"
                />
                </div>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-gray-900">Location Information</h3>
            <div className="space-y-2">
              <Label htmlFor="locationAddress" className="text-sm font-medium text-gray-700">Pickup Address</Label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-cyan-600" />
                  </div>
                </div>
              <Input
                id="locationAddress"
                value={formData.locationAddress}
                onChange={(e) => handleInputChange('locationAddress', e.target.value)}
                placeholder="Enter full address"
                disabled={isLoading}
                  className="pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
              />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="latitude" className="text-sm font-medium text-gray-700">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude || ''}
                  onChange={(e) => handleInputChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="e.g., -33.8688"
                  disabled={isLoading}
                  className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude" className="text-sm font-medium text-gray-700">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude || ''}
                  onChange={(e) => handleInputChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="e.g., 151.2093"
                  disabled={isLoading}
                  className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Lead Source & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="leadSource" className="text-sm font-medium text-gray-700">Lead Source *</Label>
              <Select 
                value={formData.leadSource}
                onValueChange={(value) => handleInputChange('leadSource', value as LeadSourceEnum)}
                disabled={isLoading}
              >
                <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEBFORM">Web Form</SelectItem>
                  <SelectItem value="CHATBOT">Chatbot</SelectItem>
                  <SelectItem value="CALL">Call</SelectItem>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value as LeadStatus)}
                disabled={isLoading}
              >
                <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="CONTACTED">Contacted</SelectItem>
                  <SelectItem value="QUOTED">Quoted</SelectItem>
                  <SelectItem value="CONVERTED">Converted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Vehicle Photos</h3>
            </div>
            <ImageUpload
              value={formData.photos || []}
              onChange={handlePhotosChange}
              maxFiles={10}
              uploadType="lead/vehicles/images"
              disabled={isLoading}
              showPreview={true}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-cyan-600" />
              </div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Internal Notes</Label>
            </div>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 resize-none transition-all"
              placeholder="Add any additional notes..."
            />
          </div>

          <DialogFooter className="pt-6 border-t border-gray-200 mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
              className="h-12 px-6 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-700 font-medium transition-all"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
