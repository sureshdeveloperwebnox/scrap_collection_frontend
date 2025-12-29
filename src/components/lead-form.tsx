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
import { validatePhoneNumber, getPhonePlaceholder } from '@/lib/phone-utils';
import { CountryCode } from 'libphonenumber-js';
import { GoogleMapPicker } from '@/components/google-map-picker';
import { z } from 'zod';

interface LeadFormProps {
  lead?: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (lead: Partial<Lead>) => void;
}

// Scrap type enum values as array (constant, defined outside component)
const VEHICLE_TYPE_VALUES = ['CAR', 'BIKE', 'TRUCK', 'BOAT', 'VAN', 'SUV'] as const;

// Zod validation schema for lead form
const createLeadSchema = z.object({
  organizationId: z.number().int().positive(),
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters long')
    .max(100, 'Full name cannot exceed 100 characters')
    .trim(),
  phone: z.string()
    .optional()
    .superRefine((val, ctx) => {
      if (!val || val.trim() === '' || val === '+') {
        return; // Optional
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
    .min(1, 'Email is required')
    .email('Please provide a valid email address'),
  vehicleType: z.enum(['CAR', 'BIKE', 'TRUCK', 'BOAT', 'VAN', 'SUV']).optional(),
  vehicleMake: z.string().max(50, 'Make cannot exceed 50 characters').optional().or(z.literal('')),
  vehicleModel: z.string().max(50, 'Model cannot exceed 50 characters').optional().or(z.literal('')),
  vehicleYear: z.number()
    .int('Year must be a whole number')
    .min(1900, 'Year must be 1900 or later')
    .max(new Date().getFullYear() + 1, `Year cannot exceed ${new Date().getFullYear() + 1}`)
    .optional()
    .nullable(),
  vehicleCondition: z.enum(['JUNK', 'DAMAGED', 'WRECKED', 'ACCIDENTAL', 'FULLY_SCRAP']).optional(),
  locationAddress: z.string()
    .min(1, 'Location address is required')
    .min(5, 'Location address must be at least 5 characters long')
    .max(500, 'Location address cannot exceed 500 characters'),
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
  leadSource: z.enum(['WEBFORM', 'CHATBOT', 'CALL', 'MANUAL'], {
    message: 'Lead source is required and must be one of: WEBFORM, CHATBOT, CALL, MANUAL'
  }),
  photos: z.array(z.string()).optional(),
  notes: z.string().optional().or(z.literal('')),
  status: z.enum(['NEW', 'CONTACTED', 'QUOTED', 'CONVERTED', 'REJECTED']).optional(),
  customerId: z.string().uuid('Invalid customer ID format').optional().or(z.literal('')),
});

const updateLeadSchema = createLeadSchema.partial().extend({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters long')
    .max(100, 'Full name cannot exceed 100 characters')
    .trim()
    .optional(),
  phone: z.string()
    .optional()
    .superRefine((val, ctx) => {
      if (!val || val.trim() === '' || val === '+') {
        return; // Optional
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
  email: z.string()
    .min(1, 'Email is required')
    .email('Please provide a valid email address')
    .optional(),
  locationAddress: z.string()
    .min(1, 'Location address is required')
    .min(5, 'Location address must be at least 5 characters long')
    .max(500, 'Location address cannot exceed 500 characters')
    .optional(),
});

export function LeadForm({ lead, isOpen, onClose, onSubmit }: LeadFormProps) {
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('AU');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
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
      // Detect country from existing phone number
      if (lead.phone) {
        const validation = validatePhoneNumber(lead.phone);
        if (validation.country) {
          setSelectedCountry(validation.country);
        }
      }

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

    // Clear previous validation errors
    setValidationErrors({});
    setPhoneTouched(true);
    setPhoneError(undefined);

    // Prepare data for validation
    const dataToValidate = {
      organizationId: formData.organizationId,
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email || '',
      vehicleType: formData.vehicleType,
      vehicleMake: formData.vehicleMake || '',
      vehicleModel: formData.vehicleModel || '',
      vehicleYear: formData.vehicleYear,
      vehicleCondition: formData.vehicleCondition,
      locationAddress: formData.locationAddress || '',
      latitude: formData.latitude,
      longitude: formData.longitude,
      leadSource: formData.leadSource,
      photos: formData.photos || [],
      notes: formData.notes || '',
      status: formData.status,
      customerId: formData.customerId || '',
    };

    // Ensure email is not empty for create
    if (!lead && (!dataToValidate.email || dataToValidate.email.trim() === '')) {
      setValidationErrors({ email: 'Email is required' });
      toast.error('Email is required');
      return;
    }

    // Ensure locationAddress is not empty for create
    if (!lead && (!dataToValidate.locationAddress || dataToValidate.locationAddress.trim() === '')) {
      setValidationErrors({ locationAddress: 'Location address is required' });
      toast.error('Location address is required');
      return;
    }

    // Validate using Zod schema
    const schema = lead ? updateLeadSchema : createLeadSchema;
    const validationResult = schema.safeParse(dataToValidate);

    if (!validationResult.success) {
      // Extract validation errors
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });

      setValidationErrors(errors);

      // Show first error in toast
      const firstError = validationResult.error.issues[0];
      toast.error(firstError.message || 'Please fix the validation errors');

      // Set phone error if it exists
      if (errors.phone) {
        setPhoneError(errors.phone);
      }

      return;
    }

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
        // Only update location fields if they have valid values
        if (formData.locationAddress !== undefined && formData.locationAddress !== null && formData.locationAddress.trim() !== '') {
          updateData.locationAddress = formData.locationAddress.trim();
        }
        // Save latitude if it's a valid number (allow 0 for equator, but not if both lat and lng are 0)
        if (formData.latitude !== undefined && formData.latitude !== null && !isNaN(formData.latitude)) {
          // Only exclude if both coordinates are exactly 0 (invalid location in Gulf of Guinea)
          if (!(formData.latitude === 0 && formData.longitude === 0)) {
            updateData.latitude = formData.latitude;
          }
        }
        // Save longitude if it's a valid number (allow 0 for prime meridian, but not if both lat and lng are 0)
        if (formData.longitude !== undefined && formData.longitude !== null && !isNaN(formData.longitude)) {
          // Only exclude if both coordinates are exactly 0 (invalid location in Gulf of Guinea)
          if (!(formData.latitude === 0 && formData.longitude === 0)) {
            updateData.longitude = formData.longitude;
          }
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
        console.log('Location data being updated:', {
          locationAddress: updateData.locationAddress,
          latitude: updateData.latitude,
          longitude: updateData.longitude
        });

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
          leadSource: formData.leadSource,
          photos: formData.photos,
          notes: formData.notes,
        };

        // Only include location fields if they have valid values
        if (formData.locationAddress && formData.locationAddress.trim() !== '') {
          submitData.locationAddress = formData.locationAddress.trim();
        }
        // Save latitude if it's a valid number (allow 0 for equator, but not if both lat and lng are 0)
        if (formData.latitude !== undefined && formData.latitude !== null && !isNaN(formData.latitude)) {
          // Only exclude if both coordinates are exactly 0 (invalid location in Gulf of Guinea)
          if (!(formData.latitude === 0 && formData.longitude === 0)) {
            submitData.latitude = formData.latitude;
          }
        }
        // Save longitude if it's a valid number (allow 0 for prime meridian, but not if both lat and lng are 0)
        if (formData.longitude !== undefined && formData.longitude !== null && !isNaN(formData.longitude)) {
          // Only exclude if both coordinates are exactly 0 (invalid location in Gulf of Guinea)
          if (!(formData.latitude === 0 && formData.longitude === 0)) {
            submitData.longitude = formData.longitude;
          }
        }

        // Only include customerId if it exists
        if (formData.customerId) {
          submitData.customerId = formData.customerId;
        }

        console.log('Creating lead with data:', submitData);
        console.log('Location data being saved:', {
          locationAddress: submitData.locationAddress,
          latitude: submitData.latitude,
          longitude: submitData.longitude
        });

        await createLeadMutation.mutateAsync(submitData);

        if (onSubmit) {
          onSubmit(submitData);
        }

        toast.success('Lead created successfully!');
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving lead:', error);

      // Handle API validation errors
      if (error?.response?.data?.errors) {
        // Joi validation errors from API
        const apiErrors: Record<string, string> = {};
        const errorDetails = error.response.data.errors;

        if (Array.isArray(errorDetails)) {
          errorDetails.forEach((err: any) => {
            if (err.path && err.message) {
              const path = Array.isArray(err.path) ? err.path.join('.') : err.path;
              apiErrors[path] = err.message;
            }
          });
        } else if (typeof errorDetails === 'object') {
          Object.keys(errorDetails).forEach((key) => {
            apiErrors[key] = errorDetails[key];
          });
        }

        if (Object.keys(apiErrors).length > 0) {
          setValidationErrors(apiErrors);
          const firstError = Object.values(apiErrors)[0];
          toast.error(firstError || 'Validation failed');

          // Set phone error if it exists
          if (apiErrors.phone) {
            setPhoneError(apiErrors.phone);
          }
        } else {
          const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred';
          toast.error(errorMessage);
        }
      } else {
        // Generic error message
        const errorMessage = error?.response?.data?.message || error?.message || 'An error occurred';
        toast.error(lead ? `Failed to update lead: ${errorMessage}` : `Failed to create lead: ${errorMessage}`);
      }
    }
  };

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

  const handlePhotosChange = (urls: string[]) => {
    setFormData(prev => ({ ...prev, photos: urls }));
  };

  const isLoading = createLeadMutation.isPending || updateLeadMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:max-w-[1400px] max-h-[95vh] bg-white border-0 shadow-2xl rounded-2xl p-0 flex flex-col [&>button]:hidden text-left"
        onInteractOutside={(e) => {
          // Prevent closing when clicking outside the dialog (backdrop/empty spaces)
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
                {lead ? 'Edit Lead' : 'Create Lead'}
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-2">
                {lead ? 'Update lead information' : 'Fill in the details to create a new lead'}
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
                form="lead-form"
                disabled={isLoading}
                variant="outline"
                className="btn-shine relative overflow-hidden group h-12 px-8 rounded-xl border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-600 font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all transform hover:scale-105 active:scale-95 bg-white backdrop-blur-sm"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-5 w-5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                      {lead ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    lead ? 'Update Lead' : 'Create Lead'
                  )}
                </span>
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto min-h-0">
          <form id="lead-form" onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
            {/* Main Two-Column Layout for Landscape Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Customer Information - Horizontal Layout */}
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Lead Information</h3>
                  <div className="grid grid-cols-1 gap-5">
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
                          className={`pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                            }`}
                          placeholder="Enter full name"
                        />
                      </div>
                      {validationErrors.fullName && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.fullName}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone</Label>
                      <div className="flex flex-col gap-2">
                        <PhoneInput
                          country={selectedCountry.toLowerCase()}
                          value={formData.phone?.replace(/^\+/, '') || ''} // Remove + prefix for react-phone-input-2 (it adds it automatically)
                          preferredCountries={['au', 'us', 'gb', 'in', 'nz', 'ca']} // Preferred countries
                          disableCountryGuess={false} // Prevent automatic country switching
                          disableDropdown={false} // Allow manual country selection
                          onChange={(value, countryData: any) => {
                            if (countryData && countryData.iso2) {
                              const isoCode = countryData.iso2.toUpperCase() as CountryCode;
                              setSelectedCountry(isoCode);
                            }

                            // value from react-phone-input-2 includes country code but without +
                            // Add + prefix for storage
                            const phoneWithPlus = value.startsWith('+') ? value : `+${value}`;
                            handleInputChange('phone', phoneWithPlus);

                            // Clear error when user starts typing (don't validate while typing)
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
                              setPhoneError(undefined);
                            }
                          }}
                          // Country code will appear inside the input field by default
                          disableCountryCode={false} // Include country code in the value
                          inputProps={{
                            required: false,
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
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email *</Label>
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
                          required
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
                  </div>
                </div>

                {/* Scrap Details - Horizontal Layout */}
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Scrap Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="vehicleMake" className="text-sm font-medium text-gray-700">Make</Label>
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
                      <Label htmlFor="vehicleYear" className="text-sm font-medium text-gray-700">Year</Label>
                      <Select
                        value={formData.vehicleYear?.toString() || ''}
                        onValueChange={(value) => handleInputChange('vehicleYear', parseInt(value) || new Date().getFullYear())}
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

                {/* Lead Source & Status - Horizontal Layout */}
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Lead Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="leadSource" className="text-sm font-medium text-gray-700">Lead Source *</Label>
                      <Select
                        value={formData.leadSource}
                        onValueChange={(value) => handleInputChange('leadSource', value as LeadSourceEnum)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.leadSource ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                          }`}>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WEBFORM">Web Form</SelectItem>
                          <SelectItem value="CHATBOT">Chatbot</SelectItem>
                          <SelectItem value="CALL">Call</SelectItem>
                          <SelectItem value="MANUAL">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                      {validationErrors.leadSource && (
                        <p className="text-sm text-red-600 mt-1">{validationErrors.leadSource}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium text-gray-700">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleInputChange('status', value as LeadStatus)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.status ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                          }`}>
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
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Location Information - Google Maps Integration */}
                <div className="space-y-5">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location Information</h3>
                  <div className="space-y-2">
                    <GoogleMapPicker
                      latitude={formData.latitude || 0}
                      longitude={formData.longitude || 0}
                      address={formData.locationAddress}
                      onLocationChange={(lat, lng) => {
                        console.log('Location changed:', { lat, lng });
                        handleInputChange('latitude', lat);
                        handleInputChange('longitude', lng);
                      }}
                      onAddressChange={(address) => {
                        console.log('Address changed:', address);
                        handleInputChange('locationAddress', address);
                      }}
                      showCoordinates={false}
                    />
                    {validationErrors.locationAddress && (
                      <p className="text-sm text-red-600 mt-1">{validationErrors.locationAddress}</p>
                    )}
                  </div>
                </div>

                {/* Photos */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-cyan-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 flex-1">Scrap Photos</h3>
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
                    rows={6}
                    disabled={isLoading}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:border-cyan-400 resize-none transition-all"
                    placeholder="Add any additional notes..."
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
