'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/lib/store/auth-store';
import { useUpdateProfile } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { validatePhoneNumber, getPhonePlaceholder } from '@/lib/phone-utils';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { CountryCode } from 'libphonenumber-js';
import { User, Mail, Phone, Shield, Camera, Loader2 } from 'lucide-react';
import { imageUploadApi } from '@/lib/api/image-upload';

import { useRef } from 'react';
import { getImageUrl } from '@/utils/image-utils';

interface UserProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UserProfileDialog({ isOpen, onClose }: UserProfileDialogProps) {
    const { user } = useAuthStore();
    const updateProfileMutation = useUpdateProfile();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [phoneError, setPhoneError] = useState<string | undefined>(undefined);
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>('AU');
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        profileImg: '',
    });

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                fullName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
                email: user.email || '',
                phone: user.phone || '',
                profileImg: user.profileImg || '',
            });

            if (user.phone) {
                const validation = validatePhoneNumber(user.phone);
                if (validation.country) {
                    setSelectedCountry(validation.country);
                }
            }

            setValidationErrors({});
            setPhoneError(undefined);
        }
    }, [user, isOpen]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image size should be less than 5MB");
            return;
        }

        setIsUploading(true);
        try {
            const response = await imageUploadApi.uploadImages([file], 'user/profile');
            if (response.data.paths && response.data.paths.length > 0) {
                setFormData(prev => ({ ...prev, profileImg: response.data.paths[0] }));
                toast.success("Profile image uploaded successfully");
            }
        } catch (error) {
            console.error("Upload failed", error);
            toast.error("Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationErrors({});

        const errors: Record<string, string> = {};
        if (!formData.fullName.trim()) errors.fullName = "Full name is required";
        if (!formData.email.trim()) errors.email = "Email is required";

        // Validate phone if provided
        let finalPhone = formData.phone;
        if (finalPhone && finalPhone.trim() !== '' && finalPhone !== '+') {
            const validation = validatePhoneNumber(finalPhone, selectedCountry);
            if (!validation.isValid) {
                errors.phone = validation.error || "Invalid phone number";
                setPhoneError(validation.error || "Invalid phone number");
            } else {
                finalPhone = validation.formatted || finalPhone;
            }
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        try {
            await updateProfileMutation.mutateAsync({
                fullName: formData.fullName,
                email: formData.email,
                phone: finalPhone,
                profileImg: formData.profileImg,
            });
            onClose();
        } catch (error) {
            // Error handled in hook
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (validationErrors[field]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const isLoading = updateProfileMutation.isPending || isUploading;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:max-w-[600px] bg-white border-0 shadow-2xl rounded-2xl p-0 flex flex-col [&>button]:hidden text-left"
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="px-6 pt-8 pb-6 border-b border-gray-100">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold text-gray-900">
                                Edit Profile
                            </DialogTitle>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isLoading}
                                className="h-10 px-4 rounded-xl border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium transition-all"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="profile-form"
                                disabled={isLoading}
                                className="h-10 px-6 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-md transition-all"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6">
                    <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar Upload Section */}
                        <div className="flex flex-col items-center justify-center space-y-4 pb-4 border-b border-gray-50">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-gray-100 bg-cyan-50 flex items-center justify-center transition-all group-hover:ring-cyan-200">
                                    {formData.profileImg ? (
                                        <img
                                            src={getImageUrl(formData.profileImg)}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-3xl font-bold text-cyan-700 uppercase">
                                            {formData.fullName?.charAt(0) || user?.name?.charAt(0) || 'U'}
                                        </span>
                                    )}
                                    {isUploading && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center animate-in fade-in">
                                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isLoading}
                                    className="absolute bottom-0 right-0 p-2 rounded-full bg-cyan-600 text-white shadow-md hover:bg-cyan-700 transition-all border-2 border-white disabled:opacity-50"
                                >
                                    <Camera className="h-4 w-4" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isLoading}
                                    className="hidden"
                                />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-semibold text-gray-900">Profile Picture</p>
                                <p className="text-xs text-gray-500">JPG, PNG or WebP. Max 5MB</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name *</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-600 z-10">
                                    <User className="h-4 w-4" />
                                </div>
                                <Input
                                    id="fullName"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className={`pl-10 h-11 rounded-xl border-gray-200 focus:border-cyan-500 focus:ring-cyan-500/20 transition-all bg-white relative z-0 ${validationErrors.fullName ? 'border-red-500' : ''
                                        }`}
                                    placeholder="Enter full name"
                                />
                            </div>
                            {validationErrors.fullName && <p className="text-xs text-red-600">{validationErrors.fullName}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address *</Label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-600 z-10">
                                    <Mail className="h-4 w-4" />
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    required
                                    disabled={isLoading}
                                    className={`pl-10 h-11 rounded-xl border-gray-200 focus:border-cyan-500 focus:ring-cyan-500/20 transition-all bg-white relative z-0 ${validationErrors.email ? 'border-red-500' : ''
                                        }`}
                                    placeholder="Enter email address"
                                />
                            </div>
                            {validationErrors.email && <p className="text-xs text-red-600">{validationErrors.email}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                            <PhoneInput
                                country={selectedCountry.toLowerCase()}
                                value={formData.phone?.replace(/^\+/, '') || ''}
                                onChange={(value, countryData: any) => {
                                    if (countryData && countryData.iso2) {
                                        setSelectedCountry(countryData.iso2.toUpperCase() as CountryCode);
                                    }
                                    const phoneWithPlus = value.startsWith('+') ? value : `+${value}`;
                                    handleInputChange('phone', phoneWithPlus);
                                    if (phoneError) setPhoneError(undefined);
                                }}
                                inputClass={`!w-full !h-11 !rounded-xl !border-gray-200 !text-sm focus:!border-cyan-500 focus:!ring-cyan-500/20 transition-all ${phoneError ? '!border-red-500' : ''
                                    }`}
                                containerClass="!w-full"
                                buttonClass={`!border-gray-200 !rounded-l-xl ${phoneError ? '!border-red-500' : ''}`}
                                disabled={isLoading}
                                preferredCountries={['au', 'us', 'gb', 'in', 'nz', 'ca']}
                                placeholder={getPhonePlaceholder(selectedCountry)}
                                specialLabel=""
                            />
                            {phoneError && <p className="text-xs text-red-600">{phoneError}</p>}
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-700">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Role: {user?.role || 'User'}</p>
                                    <p className="text-xs text-gray-500">Contact admin to change your role or organization settings.</p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
