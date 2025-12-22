'use client';

import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, DirectionsService, DirectionsRenderer, Marker } from '@react-google-maps/api';
import { Loader2, MapPin } from 'lucide-react';

const mapContainerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '0.75rem',
};

interface DistanceMapProps {
    origin: { lat: number; lng: number };
    destination?: { lat: number; lng: number } | null;
    onRouteInfo?: (info: { distance: string; duration: string }) => void;
}

export function DistanceMap({ origin, destination, onRouteInfo }: DistanceMapProps) {
    const [response, setResponse] = useState<google.maps.DirectionsResult | null>(null);
    const [isLoading, setIsLoading] = useState(destination ? true : false);

    const directionsCallback = useCallback((res: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
        if (res !== null && status === 'OK') {
            setResponse(res);
            setIsLoading(false);

            const route = res.routes[0];
            if (route && route.legs[0]) {
                onRouteInfo?.({
                    distance: route.legs[0].distance?.text || 'N/A',
                    duration: route.legs[0].duration?.text || 'N/A',
                });
            }
        } else {
            console.error('Directions request failed:', status);
            setIsLoading(false);
        }
    }, [onRouteInfo]);

    const center = destination
        ? {
            lat: (origin.lat + destination.lat) / 2,
            lng: (origin.lng + destination.lng) / 2,
        }
        : origin;

    return (
        <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md bg-gray-50">
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 text-cyan-500 animate-spin" />
                        <p className="text-sm font-medium text-gray-500">Calculating route...</p>
                    </div>
                </div>
            )}

            <GoogleMap
                id="order-distance-map"
                mapContainerStyle={mapContainerStyle}
                zoom={destination ? 8 : 14}
                center={center}
                options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                    styles: [
                        {
                            featureType: 'all',
                            elementType: 'geometry',
                            stylers: [{ color: '#f5f5f5' }]
                        },
                        {
                            featureType: 'water',
                            elementType: 'geometry',
                            stylers: [{ color: '#e9e9e9' }]
                        },
                        {
                            featureType: 'poi',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }]
                        }
                    ]
                }}
            >
                {destination && (
                    <DirectionsService
                        options={{
                            origin,
                            destination,
                            travelMode: google.maps.TravelMode.DRIVING,
                        }}
                        callback={directionsCallback}
                    />
                )}

                {response !== null && (
                    <DirectionsRenderer
                        options={{
                            directions: response,
                            polylineOptions: {
                                strokeColor: '#0891b2',
                                strokeOpacity: 0.8,
                                strokeWeight: 4,
                            },
                            markerOptions: {
                                visible: false
                            }
                        }}
                    />
                )}

                {/* Custom Markers */}
                <Marker
                    position={origin}
                    label={{ text: 'A', color: 'white', fontWeight: 'bold' }}
                    icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        fillColor: '#0891b2',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 2,
                        scale: 12
                    }}
                />

                {destination && (
                    <Marker
                        position={destination}
                        label={{ text: 'B', color: 'white', fontWeight: 'bold' }}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            fillColor: '#10b981',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                            scale: 12
                        }}
                    />
                )}
            </GoogleMap>
        </div>
    );
}
