'use client';

import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddressAutocompleteProps {
    value: string;
    onChange: (address: string, lat?: number, lng?: number) => void;
    label?: string;
    placeholder?: string;
    error?: string;
    required?: boolean;
}

export function AddressAutocomplete({
    value,
    onChange,
    label = 'Billing Address',
    placeholder = 'Enter address',
    error,
    required = false,
}: AddressAutocompleteProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Check if Google Maps is already loaded
        if (typeof window !== 'undefined' && window.google && window.google.maps) {
            setIsLoaded(true);
            return;
        }

        // Load Google Maps script
        const script = document.createElement('script');
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            console.warn('Google Maps API key not found. Address autocomplete will not work.');
            return;
        }

        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setIsLoaded(true);
        document.head.appendChild(script);

        return () => {
            // Cleanup script on unmount
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    useEffect(() => {
        if (!isLoaded || !inputRef.current) return;

        // Initialize autocomplete
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
            types: ['address'],
            fields: ['formatted_address', 'geometry'],
        });

        // Add place changed listener
        autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace();

            if (place && place.formatted_address) {
                const lat = place.geometry?.location?.lat();
                const lng = place.geometry?.location?.lng();
                onChange(place.formatted_address, lat, lng);
            }
        });

        return () => {
            // Cleanup autocomplete
            if (autocompleteRef.current) {
                google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, [isLoaded, onChange]);

    return (
        <div className="space-y-2">
            {label && (
                <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </Label>
            )}
            <Input
                ref={inputRef}
                id="address"
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200/20 transition-all ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''
                    }`}
                required={required}
            />
            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
            {!isLoaded && (
                <p className="text-xs text-gray-500">Loading address autocomplete...</p>
            )}
        </div>
    );
}
