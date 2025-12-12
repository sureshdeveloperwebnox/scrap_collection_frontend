'use client';

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Search } from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '450px',
};

const defaultCenter = {
  lat: -25.2744, // Australia center
  lng: 133.7751,
};

interface GoogleMapPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
  address?: string;
  onAddressChange?: (address: string) => void;
  showCoordinates?: boolean; // Option to show/hide latitude/longitude input fields
}

export function GoogleMapPicker({
  latitude,
  longitude,
  onLocationChange,
  address,
  onAddressChange,
  showCoordinates = true, // Default to showing coordinates
}: GoogleMapPickerProps) {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReverseGeocodingRef = useRef(false); // Track if address change came from reverse geocoding
  const isAutocompleteSelectionRef = useRef(false); // Track if address change came from autocomplete selection

  const center = useMemo(() => {
    if (latitude && longitude && latitude !== 0 && longitude !== 0) {
      return { lat: latitude, lng: longitude };
    }
    return defaultCenter;
  }, [latitude, longitude]);

  const position = useMemo(() => {
    if (latitude && longitude && latitude !== 0 && longitude !== 0) {
      return { lat: latitude, lng: longitude };
    }
    return null;
  }, [latitude, longitude]);

  // Geocode address when it changes (debounced) - only if address is manually typed
  useEffect(() => {
    if (!address || !window.google?.maps?.Geocoder) return;
    if (isGeocoding) return; // Prevent infinite loop
    // Skip if this address change came from reverse geocoding
    if (isReverseGeocodingRef.current) {
      isReverseGeocodingRef.current = false;
      return;
    }
    // Skip if this address change came from autocomplete selection
    if (isAutocompleteSelectionRef.current) {
      isAutocompleteSelectionRef.current = false;
      return;
    }

    // Clear previous timeout
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }

    // Debounce geocoding to avoid too many API calls
    geocodeTimeoutRef.current = setTimeout(() => {
      const geocoder = new window.google.maps.Geocoder();
      setIsGeocoding(true);
      geocoder.geocode({ address: address.trim() }, (results, status) => {
        setIsGeocoding(false);
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          // Only update if coordinates actually changed significantly
          if (!latitude || !longitude || 
              Math.abs(lat - latitude) > 0.001 || 
              Math.abs(lng - longitude) > 0.001) {
            onLocationChange(lat, lng);
          }
        } else if (status !== 'OK') {
          console.warn('Geocoding failed:', status, 'for address:', address);
        }
      });
    }, 1500); // Wait 1.5 seconds after user stops typing

    return () => {
      if (geocodeTimeoutRef.current) {
        clearTimeout(geocodeTimeoutRef.current);
      }
    };
  }, [address, latitude, longitude, onLocationChange]);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      onLocationChange(lat, lng);
      
      // Reverse geocode to get address
      if (onAddressChange && window.google?.maps?.Geocoder) {
        setIsGeocoding(true);
        isReverseGeocodingRef.current = true; // Mark that address change is from reverse geocoding
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          setIsGeocoding(false);
          if (status === 'OK' && results && results[0]) {
            const address = results[0].formatted_address || '';
            if (address.trim()) {
              onAddressChange(address.trim());
            }
          } else if (status !== 'OK') {
            console.warn('Reverse geocoding failed:', status);
          }
        });
      }
    }
  }, [onLocationChange, onAddressChange]);

  const onPlaceChanged = useCallback(() => {
    if (autocomplete && onAddressChange && onLocationChange) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        // Get the complete address - prefer formatted_address, fallback to constructing from components
        let fullAddress = place.formatted_address || '';
        
        // If formatted_address is not available, construct from address components
        if (!fullAddress && place.address_components) {
          const addressParts: string[] = [];
          
          // Extract address components
          const streetNumber = place.address_components.find(
            (component: any) => component.types.includes('street_number')
          )?.long_name;
          
          const route = place.address_components.find(
            (component: any) => component.types.includes('route')
          )?.long_name;
          
          const locality = place.address_components.find(
            (component: any) => component.types.includes('locality')
          )?.long_name;
          
          const administrativeAreaLevel1 = place.address_components.find(
            (component: any) => component.types.includes('administrative_area_level_1')
          )?.long_name;
          
          const country = place.address_components.find(
            (component: any) => component.types.includes('country')
          )?.long_name;
          
          const postalCode = place.address_components.find(
            (component: any) => component.types.includes('postal_code')
          )?.long_name;
          
          // Build address string
          if (streetNumber || route) {
            addressParts.push([streetNumber, route].filter(Boolean).join(' '));
          }
          if (locality) {
            addressParts.push(locality);
          }
          if (administrativeAreaLevel1) {
            addressParts.push(administrativeAreaLevel1);
          }
          if (postalCode) {
            addressParts.push(postalCode);
          }
          if (country) {
            addressParts.push(country);
          }
          
          fullAddress = addressParts.join(', ');
        }
        
        // Fallback to place name if still no address
        if (!fullAddress && place.name) {
          fullAddress = place.name;
        }
        
        // Mark that this is from autocomplete selection to prevent geocoding effect
        isAutocompleteSelectionRef.current = true;
        
        console.log('Place selected from autocomplete:', {
          lat,
          lng,
          address: fullAddress,
          placeName: place.name,
          formattedAddress: place.formatted_address
        });
        
        // Update coordinates first
        onLocationChange(lat, lng);
        
        // Then update address if we have one
        if (fullAddress && fullAddress.trim()) {
          onAddressChange(fullAddress.trim());
        } else {
          console.warn('No address found for selected place');
        }
      }
    }
  }, [autocomplete, onLocationChange, onAddressChange]);

  const onLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  }, []);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    return (
      <div className="space-y-2">
        <Label>Location</Label>
        <div className="p-4 border rounded-md bg-yellow-50 text-yellow-800 text-sm">
          Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables to use Google Maps.
          <div className="mt-2 space-y-2">
            <div className="space-y-1">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={latitude || ''}
                onChange={(e) => onLocationChange(parseFloat(e.target.value) || 0, longitude)}
                placeholder="-90 to 90"
                min={-90}
                max={90}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={longitude || ''}
                onChange={(e) => onLocationChange(latitude, parseFloat(e.target.value) || 0)}
                placeholder="-180 to 180"
                min={-180}
                max={180}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="space-y-2">
          <Label>Location</Label>
          
          {/* Search box above the map */}
          {onAddressChange && (
            <div className="space-y-2 mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
                <Autocomplete
                  onLoad={onLoad}
                  onPlaceChanged={onPlaceChanged}
                  options={{
                    fields: ['formatted_address', 'geometry', 'name', 'place_id', 'address_components'],
                    types: ['geocode', 'establishment'],
                  }}
                >
                  <Input
                    ref={addressInputRef}
                    id="address-search"
                    value={address || ''}
                    onChange={(e) => onAddressChange(e.target.value)}
                    placeholder="Search for a location"
                    className="pl-10"
                  />
                </Autocomplete>
              </div>
              <p className="text-xs text-gray-500">
                Search for a location or click on the map to select coordinates.
              </p>
            </div>
          )}

          <div className="border rounded-md overflow-hidden relative">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={latitude && longitude && latitude !== 0 && longitude !== 0 ? 15 : 5}
              onClick={onMapClick}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
              }}
            >
              {position && <Marker position={position} />}
            </GoogleMap>
          </div>
          <p className="text-xs text-gray-500">
            Click on the map to select a location. The address will be automatically filled.
          </p>
        </div>

        {showCoordinates && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="latitude"
                type="number"
                step="any"
                value={latitude || ''}
                onChange={(e) => onLocationChange(parseFloat(e.target.value) || 0, longitude)}
                placeholder="-90 to 90"
                min={-90}
                max={90}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="longitude"
                type="number"
                step="any"
                value={longitude || ''}
                onChange={(e) => onLocationChange(latitude, parseFloat(e.target.value) || 0)}
                placeholder="-180 to 180"
                min={-180}
                max={180}
                className="pl-10"
              />
            </div>
          </div>
        </div>
        )}
      </div>
  );
}

