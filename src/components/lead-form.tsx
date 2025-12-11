'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Lead, VehicleTypeEnum, VehicleConditionEnum, LeadSourceEnum, LeadStatus } from '@/types';
import { useCreateLead, useUpdateLead } from '@/hooks/use-leads';
import { useVehicleTypes } from '@/hooks/use-vehicle-types';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';
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

  // Fetch vehicle types from API
  const { data: vehicleTypesData, isLoading: vehicleTypesLoading } = useVehicleTypes({
    limit: 100, // Get all vehicle types
    status: true, // Only active vehicle types
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

  // Get vehicle types from API response
  const vehicleTypes = vehicleTypesData?.data?.vehicleTypes || [];
  
  // If no vehicle types from API, fallback to enum values
  const availableVehicleTypes = vehicleTypes.length > 0 
    ? vehicleTypes.filter(vt => vt.isActive)
    : VEHICLE_TYPE_VALUES.map(value => ({ 
        id: 0, 
        name: value, 
        isActive: true 
      }));
  
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

  // Initialize form data when lead prop changes or when vehicle types load
  useEffect(() => {
    if (lead) {
      // Ensure vehicleType is a valid enum value
      const validVehicleType = (lead.vehicleType && VEHICLE_TYPE_VALUES.includes(lead.vehicleType as any)) 
        ? lead.vehicleType 
        : 'CAR';
      
      // Normalize photo paths (convert full URLs to relative paths if needed)
      const normalizedPhotos = normalizeImagePaths(lead.photos || []);
      
      setFormData(prev => ({
        ...prev,
        organizationId: lead.organizationId || 1,
        fullName: lead.fullName || '',
        phone: lead.phone || '', // Store full phone with + prefix for backend (e.g., +61491570159)
        email: lead.email || '',
        vehicleType: validVehicleType,
        vehicleMake: lead.vehicleMake || '',
        vehicleModel: lead.vehicleModel || '',
        vehicleYear: lead.vehicleYear || new Date().getFullYear(),
        vehicleCondition: lead.vehicleCondition || 'JUNK',
        locationAddress: lead.locationAddress || '',
        latitude: lead.latitude,
        longitude: lead.longitude,
        leadSource: lead.leadSource || 'MANUAL',
        photos: normalizedPhotos, // Store relative paths only
        notes: lead.notes || '',
        status: lead.status || 'NEW',
        customerId: lead.customerId,
      }));
      setPhoneError(undefined);
      setPhoneTouched(false);
    } else {
      // Reset form for new lead
      setFormData({
        organizationId: 1,
        fullName: '',
        phone: '', // Empty phone for new lead
        email: '',
        vehicleType: 'CAR',
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
      });
    }
  }, [lead, isOpen]);

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
      <DialogContent className="w-[95vw] sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-violet-50/30 to-purple-50/30 border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {lead ? 'Edit Lead' : 'Add New Lead'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Customer Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-semibold text-gray-700">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  required
                  disabled={isLoading}
                  className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone *</Label>
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
                    inputClass={`!w-full !h-10 !rounded-md !border-gray-200 focus:!border-purple-300 focus:!ring-purple-200 ${
                      phoneError && phoneTouched ? '!border-red-500 focus:!border-red-500 focus:!ring-red-200' : ''
                    }`}
                    buttonClass={`!border-gray-200 ${phoneError && phoneTouched ? '!border-red-500' : ''}`}
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
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={isLoading}
                className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
              />
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Vehicle Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleType" className="text-sm font-semibold text-gray-700">Vehicle Type *</Label>
                <Select 
                  value={formData.vehicleType || undefined} 
                  onValueChange={(value) => {
                    // If value is from API (numeric ID), map the name to enum
                    const selectedVehicleType = availableVehicleTypes.find(vt => 
                      vt.id.toString() === value || mapVehicleTypeNameToEnum(vt.name) === value
                    );
                    const enumValue = selectedVehicleType 
                      ? mapVehicleTypeNameToEnum(selectedVehicleType.name)
                      : (value as VehicleTypeEnum);
                    handleInputChange('vehicleType', enumValue);
                  }}
                  disabled={isLoading || vehicleTypesLoading}
                >
                  <SelectTrigger className="border-gray-200 focus:border-purple-300 focus:ring-purple-200">
                    <SelectValue placeholder={vehicleTypesLoading ? "Loading vehicle types..." : "Select vehicle type"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVehicleTypes.length === 0 && !vehicleTypesLoading ? (
                      // Fallback to enum values if no vehicle types from API
                      VEHICLE_TYPE_VALUES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))
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
                <Label htmlFor="vehicleCondition" className="text-sm font-semibold text-gray-700">Condition *</Label>
                <Select 
                  value={formData.vehicleCondition}
                  onValueChange={(value) => handleInputChange('vehicleCondition', value as VehicleConditionEnum)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="border-gray-200 focus:border-purple-300 focus:ring-purple-200">
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicleMake" className="text-sm font-semibold text-gray-700">Make</Label>
                <Input
                  id="vehicleMake"
                  value={formData.vehicleMake}
                  onChange={(e) => handleInputChange('vehicleMake', e.target.value)}
                  placeholder="e.g., Toyota"
                  disabled={isLoading}
                  className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleModel" className="text-sm font-semibold text-gray-700">Model</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                  placeholder="e.g., Corolla"
                  disabled={isLoading}
                  className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleYear" className="text-sm font-semibold text-gray-700">Year</Label>
                <Input
                  id="vehicleYear"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  value={formData.vehicleYear}
                  onChange={(e) => handleInputChange('vehicleYear', parseInt(e.target.value) || new Date().getFullYear())}
                  disabled={isLoading}
                  className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Location Information</h3>
            <div className="space-y-2">
              <Label htmlFor="locationAddress" className="text-sm font-semibold text-gray-700">Pickup Address</Label>
              <Input
                id="locationAddress"
                value={formData.locationAddress}
                onChange={(e) => handleInputChange('locationAddress', e.target.value)}
                placeholder="Enter full address"
                disabled={isLoading}
                className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
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
                  placeholder="e.g., -33.8688"
                  disabled={isLoading}
                  className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
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
                  placeholder="e.g., 151.2093"
                  disabled={isLoading}
                  className="border-gray-200 focus:border-purple-300 focus:ring-purple-200"
                />
              </div>
            </div>
          </div>

          {/* Lead Source & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leadSource" className="text-sm font-semibold text-gray-700">Lead Source *</Label>
              <Select 
                value={formData.leadSource}
                onValueChange={(value) => handleInputChange('leadSource', value as LeadSourceEnum)}
                disabled={isLoading}
              >
                <SelectTrigger className="border-gray-200 focus:border-purple-300 focus:ring-purple-200">
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
              <Label htmlFor="status" className="text-sm font-semibold text-gray-700">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleInputChange('status', value as LeadStatus)}
                disabled={isLoading}
              >
                <SelectTrigger className="border-gray-200 focus:border-purple-300 focus:ring-purple-200">
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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Vehicle Photos</h3>
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
            <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">Internal Notes</Label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 resize-none"
              placeholder="Add any additional notes..."
            />
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
              className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl"
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
