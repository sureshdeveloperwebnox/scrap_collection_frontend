'use client';

import { useEffect, useRef, useState } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { Loader2, Navigation, Clock } from 'lucide-react';

const libraries: ("places" | "geometry" | "routes")[] = ['places', 'geometry', 'routes'];

interface RouteMapProps {
    collectionAddress: string;
    collectionLat?: number;
    collectionLng?: number;
    yardAddress: string;
    yardLat?: number;
    yardLng?: number;
    onRouteCalculated?: (distance: string, duration: string) => void;
}

interface RouteInfo {
    distance: string;
    duration: string;
}

export function RouteMap({
    collectionAddress,
    collectionLat,
    collectionLng,
    yardAddress,
    yardLat,
    yardLng,
    onRouteCalculated,
}: RouteMapProps) {
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

    // Debug logging
    useEffect(() => {
        console.log('RouteMap state:', { routeInfo, isLoading, isLoaded, loadError });
    }, [routeInfo, isLoading, isLoaded, loadError]);


    useEffect(() => {
        // Wait for Google Maps to load
        if (!isLoaded) return;

        if (loadError) {
            setError('Failed to load Google Maps');
            setIsLoading(false);
            return;
        }

        if (!mapRef.current) return;

        // Initialize map
        const initMap = async () => {
            try {
                const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
                const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary('routes') as google.maps.RoutesLibrary;

                // Geocode addresses if coordinates are missing
                let finalCollectionLat = collectionLat;
                let finalCollectionLng = collectionLng;
                let finalYardLat = yardLat;
                let finalYardLng = yardLng;

                const geocoder = new google.maps.Geocoder();

                // Geocode collection address if no coordinates
                if ((!collectionLat || !collectionLng) && collectionAddress) {
                    try {
                        const result = await geocoder.geocode({ address: collectionAddress });
                        if (result.results[0]) {
                            finalCollectionLat = result.results[0].geometry.location.lat();
                            finalCollectionLng = result.results[0].geometry.location.lng();
                            console.log('Geocoded collection:', finalCollectionLat, finalCollectionLng);
                        }
                    } catch (err) {
                        console.error('Failed to geocode collection address:', err);
                    }
                }

                // Geocode yard address if no coordinates
                if ((!yardLat || !yardLng) && yardAddress) {
                    try {
                        const result = await geocoder.geocode({ address: yardAddress });
                        if (result.results[0]) {
                            finalYardLat = result.results[0].geometry.location.lat();
                            finalYardLng = result.results[0].geometry.location.lng();
                            console.log('Geocoded yard:', finalYardLat, finalYardLng);
                        }
                    } catch (err) {
                        console.error('Failed to geocode yard address:', err);
                    }
                }

                // Create map centered between collection and yard
                const centerLat = finalCollectionLat && finalYardLat ? (finalCollectionLat + finalYardLat) / 2 : finalCollectionLat || finalYardLat || 0;
                const centerLng = finalCollectionLng && finalYardLng ? (finalCollectionLng + finalYardLng) / 2 : finalCollectionLng || finalYardLng || 0;

                const mapInstance = new Map(mapRef.current!, {
                    center: { lat: centerLat, lng: centerLng },
                    zoom: 12,
                    mapTypeControl: true,
                    mapTypeControlOptions: {
                        position: google.maps.ControlPosition.TOP_RIGHT,
                    },
                    fullscreenControl: true,
                    streetViewControl: false,
                    zoomControl: true,
                });

                setMap(mapInstance);

                // Create bounds to fit both markers
                const bounds = new google.maps.LatLngBounds();

                // If we have coordinates, show route
                if (finalCollectionLat && finalCollectionLng && finalYardLat && finalYardLng) {
                    // Add coordinates to bounds
                    bounds.extend({ lat: finalCollectionLat, lng: finalCollectionLng });
                    bounds.extend({ lat: finalYardLat, lng: finalYardLng });

                    const directionsService = new DirectionsService();
                    const directionsRenderer = new DirectionsRenderer({
                        map: mapInstance,
                        suppressMarkers: true, // We'll add custom markers
                        polylineOptions: {
                            strokeColor: '#06b6d4', // cyan-500
                            strokeWeight: 6,
                            strokeOpacity: 0.9,
                        },
                    });

                    // Calculate route
                    directionsService.route(
                        {
                            origin: { lat: finalCollectionLat, lng: finalCollectionLng },
                            destination: { lat: finalYardLat, lng: finalYardLng },
                            travelMode: google.maps.TravelMode.DRIVING,
                        },
                        (result, status) => {
                            console.log('Directions API status:', status);
                            if (status === 'OK' && result) {
                                directionsRenderer.setDirections(result);

                                // Extract distance and duration
                                const route = result.routes[0];
                                console.log('Route data:', route);
                                if (route && route.legs && route.legs[0]) {
                                    const leg = route.legs[0];
                                    const distance = leg.distance?.text || 'N/A';
                                    const duration = leg.duration?.text || 'N/A';

                                    console.log('Setting route info:', { distance, duration });
                                    setRouteInfo({
                                        distance,
                                        duration,
                                    });

                                    // Call callback to pass data to parent
                                    if (onRouteCalculated) {
                                        onRouteCalculated(distance, duration);
                                    }
                                } else {
                                    console.error('No route legs found');
                                }

                                // Add custom markers AFTER route is set
                                // Collection point marker (Green - Start)
                                new google.maps.Marker({
                                    position: { lat: finalCollectionLat!, lng: finalCollectionLng! },
                                    map: mapInstance,
                                    title: 'Collection Point',
                                    label: {
                                        text: 'A',
                                        color: 'white',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                    },
                                    icon: {
                                        path: google.maps.SymbolPath.CIRCLE,
                                        scale: 20,
                                        fillColor: '#10b981', // green-500
                                        fillOpacity: 1,
                                        strokeColor: '#ffffff',
                                        strokeWeight: 3,
                                    },
                                    zIndex: 1000,
                                });

                                // Scrap yard marker (Cyan - Destination)
                                new google.maps.Marker({
                                    position: { lat: finalYardLat!, lng: finalYardLng! },
                                    map: mapInstance,
                                    title: 'Scrap Yard',
                                    label: {
                                        text: 'B',
                                        color: 'white',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                    },
                                    icon: {
                                        path: google.maps.SymbolPath.CIRCLE,
                                        scale: 20,
                                        fillColor: '#06b6d4', // cyan-500
                                        fillOpacity: 1,
                                        strokeColor: '#ffffff',
                                        strokeWeight: 3,
                                    },
                                    zIndex: 1000,
                                });

                                // Fit map to show both markers
                                mapInstance.fitBounds(bounds);
                                setIsLoading(false);
                            } else {
                                console.error('Directions request failed:', status);
                                // Fallback to markers only if route fails
                                showMarkersOnly(mapInstance, finalCollectionLat, finalCollectionLng, finalYardLat, finalYardLng, bounds);
                            }
                        }
                    );
                } else {
                    // No coordinates, just show markers if we have them
                    showMarkersOnly(mapInstance, finalCollectionLat, finalCollectionLng, finalYardLat, finalYardLng, bounds);
                }
            } catch (err) {
                console.error('Error initializing map:', err);
                setError('Failed to load map');
                setIsLoading(false);
            }
        };

        const showMarkersOnly = (
            mapInstance: google.maps.Map,
            lat1?: number,
            lng1?: number,
            lat2?: number,
            lng2?: number,
            bounds?: google.maps.LatLngBounds
        ) => {
            const mapBounds = bounds || new google.maps.LatLngBounds();

            // Add markers if we have coordinates
            if (lat1 && lng1) {
                new google.maps.Marker({
                    position: { lat: lat1, lng: lng1 },
                    map: mapInstance,
                    title: 'Collection Point',
                    label: {
                        text: 'A',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold',
                    },
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 20,
                        fillColor: '#10b981',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 3,
                    },
                    zIndex: 1000,
                });
                mapBounds.extend({ lat: lat1, lng: lng1 });
            }

            if (lat2 && lng2) {
                new google.maps.Marker({
                    position: { lat: lat2, lng: lng2 },
                    map: mapInstance,
                    title: 'Scrap Yard',
                    label: {
                        text: 'B',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold',
                    },
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 20,
                        fillColor: '#06b6d4',
                        fillOpacity: 1,
                        strokeColor: '#ffffff',
                        strokeWeight: 3,
                    },
                    zIndex: 1000,
                });
                mapBounds.extend({ lat: lat2, lng: lng2 });
            }

            // Fit map to show all markers
            if (!mapBounds.isEmpty()) {
                mapInstance.fitBounds(mapBounds);
            }

            setIsLoading(false);
        };

        initMap();
    }, [isLoaded, loadError, collectionLat, collectionLng, yardLat, yardLng, collectionAddress, yardAddress]);


    if (error) {
        return (
            <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center p-6">
                <div className="text-center">
                    <p className="text-gray-600 font-medium">Map Unavailable</p>
                    <p className="text-sm text-gray-500 mt-2">{error}</p>
                    <div className="mt-4 text-left bg-white rounded-lg p-4 shadow-sm">
                        <div className="mb-3">
                            <p className="text-xs font-medium text-gray-600">Collection Point:</p>
                            <p className="text-sm text-gray-900">{collectionAddress}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-gray-600">Scrap Yard:</p>
                            <p className="text-sm text-gray-900">{yardAddress}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full rounded-xl overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Loading route...</p>
                    </div>
                </div>
            )}


            {/* Distance and Duration Info */}
            {routeInfo && !isLoading && (
                <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-2xl p-4 min-w-[250px] max-w-[350px] border-2 border-cyan-500">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">Route Information</h4>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-green-600 font-bold text-xs">A</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-600">Collection Point</p>
                                <p className="text-xs font-medium text-gray-900 truncate">{collectionAddress}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-cyan-600 font-bold text-xs">B</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-600">Scrap Yard</p>
                                <p className="text-xs font-medium text-gray-900 truncate">{yardAddress}</p>
                            </div>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Navigation className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                                <span className="text-sm font-semibold text-gray-900">{routeInfo.distance}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                                <span className="text-sm font-semibold text-gray-900">{routeInfo.duration}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div ref={mapRef} className="w-full h-full min-h-[400px]" />
        </div>
    );
}
