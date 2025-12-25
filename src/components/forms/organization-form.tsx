'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { CreateOrganizationRequest } from '@/lib/api/organizations';
import { Loader2 } from 'lucide-react';

interface OrganizationFormProps {
    onSubmit: (data: CreateOrganizationRequest) => void;
    isLoading?: boolean;
    initialData?: Partial<CreateOrganizationRequest>;
    submitButtonText?: string;
}

export function OrganizationForm({
    onSubmit,
    isLoading = false,
    initialData,
    submitButtonText = 'Create Organization',
}: OrganizationFormProps) {
    const [formData, setFormData] = useState<CreateOrganizationRequest>({
        name: initialData?.name || '',
        email: initialData?.email || '',
        website: initialData?.website || '',
        billingAddress: initialData?.billingAddress || '',
        latitude: initialData?.latitude,
        longitude: initialData?.longitude,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Organization name is required';
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
            newErrors.website = 'Please enter a valid website URL (e.g., https://example.com)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    const handleAddressChange = (address: string, lat?: number, lng?: number) => {
        setFormData({
            ...formData,
            billingAddress: address,
            latitude: lat,
            longitude: lng,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Organization Name */}
            <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                    Organization Name <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter organization name"
                    className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/20 transition-all ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                        }`}
                    required
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email
                </Label>
                <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@organization.com"
                    className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/20 transition-all ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                        }`}
                />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>

            {/* Website */}
            <div className="space-y-2">
                <Label htmlFor="website" className="text-sm font-medium text-gray-700">
                    Website
                </Label>
                <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.organization.com"
                    className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/20 transition-all ${errors.website ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                        }`}
                />
                {errors.website && <p className="text-sm text-red-600 mt-1">{errors.website}</p>}
            </div>

            {/* Billing Address with Google Maps Autocomplete */}
            <AddressAutocomplete
                value={formData.billingAddress || ''}
                onChange={handleAddressChange}
                label="Billing Address"
                placeholder="Start typing to search address..."
                error={errors.billingAddress}
            />

            {/* Submit Button */}
            <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-700 hover:to-cyan-500 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    submitButtonText
                )}
            </Button>
        </form>
    );
}
