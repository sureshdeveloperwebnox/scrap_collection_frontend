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
import { User, Mail, Phone, Shield } from 'lucide-react';

interface UserProfileDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UserProfileDialog({ isOpen, onClose }: UserProfileDialogProps) {
    const { user } = useAuthStore();
    const updateProfileMutation = useUpdateProfile();

    const [phoneError, setPhoneError] = useState<string | undefined>(undefined);
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>('AU');
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
    });

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                fullName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
                email: user.email || '',
                phone: user.phone || '',
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

    const isLoading = updateProfileMutation.isPending;

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
