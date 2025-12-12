'use client';

import { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GoogleMap, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

interface MapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  title?: string;
  address?: string;
}

export function MapDialog({ isOpen, onClose, latitude, longitude, title, address }: MapDialogProps) {
  const center = useMemo(() => ({ lat: latitude, lng: longitude }), [latitude, longitude]);
  const position = useMemo(() => ({ lat: latitude, lng: longitude }), [latitude, longitude]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{title || 'Location'}</DialogTitle>
          </DialogHeader>
          <div className="p-4 border rounded-md bg-yellow-50 text-yellow-800 text-sm">
            Google Maps API key is not configured. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>{title || 'Location'}</DialogTitle>
            {address && <p className="text-sm text-gray-600 mt-1">{address}</p>}
          </DialogHeader>
          <div className="border rounded-md overflow-hidden">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={15}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
              }}
            >
              <Marker position={position} />
            </GoogleMap>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
          </div>
        </DialogContent>
      </Dialog>
  );
}

