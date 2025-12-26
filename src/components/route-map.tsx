'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { GoogleMap, DirectionsRenderer, Marker, Polyline } from '@react-google-maps/api';
import { Loader2, Navigation, Clock, Info, MapPin, Zap } from 'lucide-react';

const mapContainerStyle = {
    width: '100%',
    height: '100%',
};

// Premium "Silver" Map Styling
const silverMapStyle = [
    {
        "featureType": "all",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#7c93a3" }, { "lightness": "-10" }]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#1f2937" }, { "weight": "bold" }]
    },
    {
        "featureType": "landscape",
        "elementType": "geometry",
        "stylers": [{ "color": "#f8fafc" }]
    },
    {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [{ "color": "#f1f5f9" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#ffffff" }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#e2e8f0" }]
    }
];

interface RouteMapProps {
    collectionAddress: string;
    collectionLat?: number;
    collectionLng?: number;
    yardAddress: string;
    yardLat?: number;
    yardLng?: number;
    onRouteCalculated?: (distance: string, duration: string) => void;
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
    const [response, setResponse] = useState<google.maps.DirectionsResult | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFallback, setIsFallback] = useState(false);
    const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
    const [locations, setLocations] = useState<{
        start?: google.maps.LatLngLiteral;
        end?: google.maps.LatLngLiteral;
    }>({});

    const calculationInProgress = useRef<string | null>(null);

    // Coordinate resolution
    useEffect(() => {
        if (typeof google === 'undefined') return;

        const resolveLocations = async () => {
            const geocoder = new google.maps.Geocoder();

            const lat1 = Number(collectionLat);
            const lng1 = Number(collectionLng);
            const lat2 = Number(yardLat);
            const lng2 = Number(yardLng);

            const startPos = (lat1 !== 0 && lng1 !== 0 && !isNaN(lat1))
                ? { lat: lat1, lng: lng1 }
                : await geocoder.geocode({ address: collectionAddress })
                    .then(res => res.results[0]?.geometry.location.toJSON())
                    .catch(() => undefined);

            const endPos = (lat2 !== 0 && lng2 !== 0 && !isNaN(lat2))
                ? { lat: lat2, lng: lng2 }
                : await geocoder.geocode({ address: yardAddress })
                    .then(res => res.results[0]?.geometry.location.toJSON())
                    .catch(() => undefined);

            setLocations({ start: startPos, end: endPos });
        };

        resolveLocations();
    }, [collectionAddress, yardAddress, collectionLat, collectionLng, yardLat, yardLng]);

    // Route Logic
    useEffect(() => {
        if (typeof google === 'undefined' || !locations.start || !locations.end) return;

        const routeKey = `${locations.start.lat},${locations.start.lng}->${locations.end.lat},${locations.end.lng}`;
        if (calculationInProgress.current === routeKey) return;

        calculationInProgress.current = routeKey;
        setIsLoading(true);

        const directionsService = new google.maps.DirectionsService();

        directionsService.route(
            {
                origin: locations.start,
                destination: locations.end,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    setResponse(result);
                    setIsLoading(false);
                    const leg = result.routes[0]?.legs[0];
                    if (leg) {
                        const info = {
                            distance: leg.distance?.text || 'N/A',
                            duration: leg.duration?.text || 'N/A'
                        };
                        setRouteInfo(info);
                        onRouteCalculated?.(info.distance, info.duration);
                    }
                } else {
                    setIsLoading(false);
                    setIsFallback(true);
                    if (google.maps.geometry) {
                        const meters = google.maps.geometry.spherical.computeDistanceBetween(
                            new google.maps.LatLng(locations.start!),
                            new google.maps.LatLng(locations.end!)
                        );
                        const distanceText = (meters / 1000).toFixed(1) + ' km (Direct)';
                        const info = { distance: distanceText, duration: 'Est. N/A' };
                        setRouteInfo(info);
                        onRouteCalculated?.(info.distance, info.duration);
                    }
                }
            }
        );
    }, [locations.start, locations.end, onRouteCalculated]);

    const center = useMemo(() => {
        if (locations.start && locations.end) {
            return {
                lat: (locations.start.lat + locations.end.lat) / 2,
                lng: (locations.start.lng + locations.end.lng) / 2,
            };
        }
        if (locations.start) return locations.start;
        return { lat: -25.2744, lng: 133.7751 };
    }, [locations]);

    if (typeof google === 'undefined') return null;

    return (
        <div className="relative w-full h-full rounded-3xl overflow-hidden bg-[#f0f4f8] border-8 border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-xl">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 border border-gray-100 scale-110">
                        <Loader2 className="h-10 w-10 animate-spin text-cyan-600" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Mapping Route</p>
                    </div>
                </div>
            )}

            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={locations.start && locations.end ? 5 : 4}
                center={center}
                options={{
                    disableDefaultUI: true,
                    zoomControl: true,
                    styles: silverMapStyle,
                    backgroundColor: '#f8fafc'
                }}
            >
                {/* Ideal Road Route */}
                {response && (
                    <DirectionsRenderer
                        directions={response}
                        options={{
                            polylineOptions: {
                                strokeColor: '#0ea5e9',
                                strokeWeight: 8,
                                strokeOpacity: 0.8,
                                zIndex: 100
                            },
                            suppressMarkers: true
                        }}
                    />
                )}

                {/* Animated Direct Fallback Line */}
                {isFallback && locations.start && locations.end && (
                    <Polyline
                        path={[locations.start, locations.end]}
                        options={{
                            strokeColor: '#f43f5e',
                            strokeWeight: 4,
                            strokeOpacity: 0.6,
                            icons: [{
                                icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, fillOpacity: 1, fillColor: '#f43f5e', strokeColor: '#fff', strokeWeight: 1 },
                                offset: '100%',
                                repeat: '120px'
                            }],
                            geodesic: true,
                            zIndex: 90
                        }}
                    />
                )}

                {/* Pickup Marker (Point A) with Pulse Effect */}
                {locations.start && (
                    <>
                        {/* Hidden pulse effect via a second marker with a expanding stroke? 
                            Actually, Google Maps markers don't easily support CSS animations.
                            We'll use a scaled circle symbol with a high fill opacity to make it pop.
                        */}
                        <Marker
                            position={locations.start}
                            icon={{
                                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                                fillColor: '#10b981',
                                fillOpacity: 1,
                                strokeColor: '#ffffff',
                                strokeWeight: 3,
                                scale: 1.8,
                                anchor: new google.maps.Point(12, 22)
                            }}
                        />
                    </>
                )}

                {/* Yard Marker */}
                {locations.end && (
                    <Marker
                        position={locations.end}
                        icon={{
                            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                            fillColor: isFallback ? '#f43f5e' : '#0ea5e9',
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 2,
                            scale: 1.5,
                            anchor: new google.maps.Point(12, 22)
                        }}
                    />
                )}
            </GoogleMap>

            {/* Premium Dynamic Data Panel */}
            <div className="absolute top-6 left-6 right-6 z-40 flex flex-col md:flex-row items-stretch md:items-center gap-4 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-3xl p-4 rounded-[2rem] shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-white flex items-center gap-5 pointer-events-auto">
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transform rotate-[-5deg] ${isFallback ? 'bg-rose-500 shadow-rose-200' : 'bg-cyan-500 shadow-cyan-200'}`}>
                        {isFallback ? <Zap className="h-6 w-6 text-white" /> : <Navigation className="h-6 w-6 text-white" />}
                    </div>

                    <div className="border-r border-gray-100 pr-5">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                            {isFallback ? 'Fast Connect' : 'Smart Routing'}
                        </h4>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-black text-gray-900 tracking-tighter">
                                {routeInfo?.distance || '--'}
                            </span>
                            {isFallback && <p className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full uppercase">Direct</p>}
                        </div>
                    </div>

                    <div className="pr-2">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <Clock className="h-4 w-4" />
                            <span className="text-[10px] font-black uppercase tracking-wider">Estimate</span>
                        </div>
                        <p className="text-sm font-black text-gray-800 tracking-tight">
                            {routeInfo?.duration || 'Calculating...'}
                        </p>
                    </div>
                </div>

                {isFallback && (
                    <div className="hidden lg:flex items-center gap-2 bg-amber-50/90 backdrop-blur-md px-5 py-3 rounded-full border border-amber-200/50 shadow-sm pointer-events-auto group">
                        <Info className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-amber-900 uppercase tracking-widest leading-none">Directions API (Not Enabled)</span>
                    </div>
                )}
            </div>

            {/* Bottom Tag */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900/10 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/20">
                <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">Scrap Management Logistics Interface v1.0</p>
            </div>
        </div>
    );
}
