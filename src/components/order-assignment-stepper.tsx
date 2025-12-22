'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEmployees } from '@/hooks/use-employees';
import { useCrews } from '@/hooks/use-crews';
import { useScrapYards } from '@/hooks/use-scrap-yards';
import { useUpdateOrder } from '@/hooks/use-orders';
import { Order, OrderStatus } from '@/types';
import { toast } from 'sonner';
import {
    MapPin,
    Users,
    Building2,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Navigation,
    Loader2
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { RouteMap } from '@/components/route-map';

interface OrderAssignmentStepperProps {
    order: Order;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface AssignmentData {
    yardId: string;
    collectorIds: string[];
    crewId: string;
    routeDistance?: string;
    routeDuration?: string;
}

export function OrderAssignmentStepper({
    order,
    isOpen,
    onClose,
    onSuccess
}: OrderAssignmentStepperProps) {
    const queryClient = useQueryClient();
    const [currentStep, setCurrentStep] = useState(1);
    const [assignmentData, setAssignmentData] = useState<AssignmentData>({
        yardId: order.yardId || '',
        collectorIds: order.assignedCollectorId ? [order.assignedCollectorId] : [],
        crewId: order.crewId || '',
        routeDistance: undefined,
        routeDuration: undefined,
    });

    // Invalidate queries when dialog opens
    useEffect(() => {
        if (isOpen) {
            queryClient.invalidateQueries({ queryKey: ['scrap-yards'] });
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['crews'] });
        }
    }, [isOpen, queryClient]);

    // Fetch data with optimized queries
    const { data: scrapYardsData, isLoading: yardsLoading } = useScrapYards({
        page: 1,
        limit: 100,
    });

    const { data: employeesData, isLoading: employeesLoading } = useEmployees({
        role: 'COLLECTOR',
        isActive: true,
        page: 1,
        limit: 100,
    });

    const { data: crewsData, isLoading: crewsLoading } = useCrews();

    const updateOrderMutation = useUpdateOrder();

    // Memoized data
    const scrapYards = useMemo(() => {
        const data = (scrapYardsData as any)?.data?.scrapYards;
        return Array.isArray(data) ? data.filter((yard: any) => yard.isActive) : [];
    }, [scrapYardsData]);

    const allCollectors = useMemo(() => {
        const data = employeesData?.data?.employees;
        return Array.isArray(data) ? data : [];
    }, [employeesData]);

    const allCrews = useMemo(() => {
        const data = (crewsData as any)?.data?.crews;
        return Array.isArray(data) ? data.filter((crew: any) => crew.isActive) : [];
    }, [crewsData]);

    // Filter collectors based on selected yard
    const availableCollectors = useMemo(() => {
        if (!assignmentData.yardId) return allCollectors;

        const selectedYard = scrapYards.find((yard: any) => yard.id === assignmentData.yardId);
        if (!selectedYard) return allCollectors;

        // Filter collectors by work zone or proximity to yard
        // For now, return all active collectors
        // TODO: Add proximity/zone-based filtering
        return allCollectors;
    }, [assignmentData.yardId, allCollectors, scrapYards]);

    // Filter crews based on selected yard
    const availableCrews = useMemo(() => {
        if (!assignmentData.yardId) return allCrews;

        // Filter crews that have members assigned to this yard's zone
        // For now, return all active crews
        // TODO: Add zone-based filtering
        return allCrews;
    }, [assignmentData.yardId, allCrews]);

    // Selected yard details
    const selectedYard = useMemo(() => {
        return scrapYards.find((yard: any) => yard.id === assignmentData.yardId);
    }, [scrapYards, assignmentData.yardId]);

    // Calculate distances (mock for now - integrate with Google Maps Distance Matrix API)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d.toFixed(2);
    };

    const deg2rad = (deg: number) => {
        return deg * (Math.PI / 180);
    };

    const handleYardSelect = (yardId: string) => {
        setAssignmentData(prev => ({ ...prev, yardId }));
    };

    const handleCollectorToggle = (collectorId: string) => {
        setAssignmentData(prev => {
            const isSelected = prev.collectorIds.includes(collectorId);
            return {
                ...prev,
                collectorIds: isSelected
                    ? prev.collectorIds.filter(id => id !== collectorId)
                    : [...prev.collectorIds, collectorId],
            };
        });
    };

    const handleCrewSelect = (crewId: string) => {
        setAssignmentData(prev => ({ ...prev, crewId }));
    };

    const handleRouteCalculated = (distance: string, duration: string) => {
        setAssignmentData(prev => ({
            ...prev,
            routeDistance: distance,
            routeDuration: duration,
        }));
    };

    const handleNext = () => {
        if (currentStep === 1 && !assignmentData.yardId) {
            toast.error('Please select a scrap yard');
            return;
        }
        if (currentStep === 2 && assignmentData.collectorIds.length === 0 && !assignmentData.crewId) {
            toast.error('Please select at least one collector or a crew');
            return;
        }
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleSubmit = async () => {
        try {
            await updateOrderMutation.mutateAsync({
                id: order.id,
                data: {
                    yardId: assignmentData.yardId,
                    assignedCollectorId: assignmentData.collectorIds[0] || undefined,
                    crewId: assignmentData.crewId || undefined,
                    orderStatus: 'ASSIGNED' as OrderStatus,
                    routeDistance: assignmentData.routeDistance,
                    routeDuration: assignmentData.routeDuration,
                },
            });

            toast.success(`Order assigned successfully! Distance: ${assignmentData.routeDistance || 'N/A'}, Duration: ${assignmentData.routeDuration || 'N/A'}`);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error assigning order:', error);
            toast.error(error?.response?.data?.message || 'Failed to assign order');
        }
    };

    const steps = [
        { number: 1, title: 'Select Yard', icon: Building2 },
        { number: 2, title: 'Assign Team', icon: Users },
        { number: 3, title: 'Review & Confirm', icon: CheckCircle2 },
    ];

    const isLoading = yardsLoading || employeesLoading || crewsLoading;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="w-[95vw] sm:max-w-[1400px] max-h-[95vh] bg-white border-0 shadow-2xl rounded-2xl p-0 flex flex-col [&>button]:hidden"
                onInteractOutside={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="px-8 pt-8 pb-6 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-3xl font-bold text-gray-900">
                                Assign Order #{order.id}
                            </DialogTitle>
                            <p className="text-sm text-gray-600 mt-2">
                                Customer: {order.customerName} • {order.address}
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={updateOrderMutation.isPending}
                            className="h-12 px-6 rounded-xl"
                        >
                            Cancel
                        </Button>
                    </div>

                    {/* Stepper */}
                    <div className="mt-8 flex items-center justify-between">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = currentStep === step.number;
                            const isCompleted = currentStep > step.number;

                            return (
                                <div key={step.number} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center flex-1">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCompleted
                                                ? 'bg-green-500 text-white'
                                                : isActive
                                                    ? 'bg-cyan-500 text-white'
                                                    : 'bg-gray-200 text-gray-500'
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle2 className="h-6 w-6" />
                                            ) : (
                                                <Icon className="h-6 w-6" />
                                            )}
                                        </div>
                                        <p
                                            className={`mt-2 text-sm font-medium ${isActive ? 'text-cyan-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                                                }`}
                                        >
                                            {step.title}
                                        </p>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div
                                            className={`h-1 flex-1 mx-4 transition-all ${currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                                                }`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 px-8 py-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                            <span className="ml-3 text-gray-600">Loading data...</span>
                        </div>
                    ) : (
                        <>
                            {/* Step 1: Select Yard */}
                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                            Select Scrap Yard
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-6">
                                            Choose the scrap yard where the collected items will be delivered
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {scrapYards.map((yard: any) => {
                                            const isSelected = assignmentData.yardId === yard.id;
                                            const distance = order.latitude && order.longitude && yard.latitude && yard.longitude
                                                ? calculateDistance(order.latitude, order.longitude, yard.latitude, yard.longitude)
                                                : null;

                                            return (
                                                <div
                                                    key={yard.id}
                                                    onClick={() => handleYardSelect(yard.id)}
                                                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                                        ? 'border-cyan-500 bg-cyan-50 shadow-lg'
                                                        : 'border-gray-200 hover:border-cyan-300 hover:shadow-md'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-cyan-500' : 'bg-gray-200'
                                                                }`}>
                                                                <Building2 className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900">{yard.yardName}</h4>
                                                                {distance && (
                                                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                                        <Navigation className="h-3 w-3" />
                                                                        {distance} km away
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <CheckCircle2 className="h-6 w-6 text-cyan-500" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">{yard.address}</p>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                                        <MapPin className="h-3 w-3" />
                                                        {yard.city}, {yard.state}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {scrapYards.length === 0 && (
                                        <div className="text-center py-12">
                                            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-600">No active scrap yards available</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 2: Assign Team */}
                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                            Assign Collectors or Crew
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-6">
                                            Select individual collectors or assign a crew for this order
                                        </p>
                                    </div>

                                    {/* Collectors Section */}
                                    <div>
                                        <Label className="text-base font-semibold text-gray-900 mb-3 block">
                                            Individual Collectors
                                        </Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {availableCollectors.map((collector: any) => {
                                                const isSelected = assignmentData.collectorIds.includes(collector.id);

                                                return (
                                                    <div
                                                        key={collector.id}
                                                        onClick={() => handleCollectorToggle(collector.id)}
                                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                                            ? 'border-cyan-500 bg-cyan-50'
                                                            : 'border-gray-200 hover:border-cyan-300'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() => handleCollectorToggle(collector.id)}
                                                                className="h-5 w-5"
                                                            />
                                                            <div className="flex-1">
                                                                <h4 className="font-semibold text-gray-900">{collector.fullName}</h4>
                                                                <p className="text-sm text-gray-600">{collector.email}</p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {collector.workZone || 'No zone assigned'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {availableCollectors.length === 0 && (
                                            <div className="text-center py-8 bg-gray-50 rounded-xl">
                                                <Users className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                                <p className="text-gray-600">No active collectors available</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Crews Section */}
                                    <div className="mt-8">
                                        <Label className="text-base font-semibold text-gray-900 mb-3 block">
                                            Or Assign a Crew
                                        </Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {availableCrews.map((crew: any) => {
                                                const isSelected = assignmentData.crewId === crew.id;

                                                return (
                                                    <div
                                                        key={crew.id}
                                                        onClick={() => handleCrewSelect(crew.id)}
                                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                                            ? 'border-green-500 bg-green-50 shadow-lg'
                                                            : 'border-gray-200 hover:border-green-300 hover:shadow-md'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-green-500' : 'bg-gray-200'
                                                                    }`}>
                                                                    <Users className={`h-5 w-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900">{crew.name}</h4>
                                                                    <p className="text-xs text-gray-500">
                                                                        {crew.members?.length || 0} members
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {isSelected && (
                                                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                                                            )}
                                                        </div>
                                                        {crew.description && (
                                                            <p className="text-sm text-gray-600 mt-2">{crew.description}</p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {availableCrews.length === 0 && (
                                            <div className="text-center py-8 bg-gray-50 rounded-xl">
                                                <Users className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                                <p className="text-gray-600">No active crews available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Review & Confirm */}
                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                                            Review Assignment
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-6">
                                            Please review the assignment details before confirming
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Assignment Summary */}
                                        <div className="space-y-4">
                                            <div className="bg-gray-50 rounded-xl p-6">
                                                <h4 className="font-semibold text-gray-900 mb-4">Order Details</h4>
                                                <div className="space-y-3">
                                                    <div>
                                                        <p className="text-sm text-gray-600">Customer</p>
                                                        <p className="font-medium text-gray-900">{order.customerName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-600">Phone</p>
                                                        <p className="font-medium text-gray-900">{order.customerPhone}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-600">Collection Address</p>
                                                        <p className="font-medium text-gray-900">{order.address}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-cyan-50 rounded-xl p-6">
                                                <h4 className="font-semibold text-gray-900 mb-4">Selected Yard</h4>
                                                {selectedYard ? (
                                                    <div className="space-y-2">
                                                        <p className="font-medium text-gray-900">{selectedYard.yardName}</p>
                                                        <p className="text-sm text-gray-600">{selectedYard.address}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {selectedYard.city}, {selectedYard.state}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-600">No yard selected</p>
                                                )}
                                            </div>

                                            <div className="bg-green-50 rounded-xl p-6">
                                                <h4 className="font-semibold text-gray-900 mb-4">Assigned Team</h4>
                                                {assignmentData.collectorIds.length > 0 && (
                                                    <div className="mb-3">
                                                        <p className="text-sm text-gray-600 mb-2">Collectors:</p>
                                                        <ul className="space-y-1">
                                                            {assignmentData.collectorIds.map(id => {
                                                                const collector = allCollectors.find((c: any) => c.id === id);
                                                                // Use order object as a fallback if available
                                                                const name = collector?.fullName ||
                                                                    (order.assignedCollectorId === id ? order.assignedCollector?.fullName : null) ||
                                                                    'Unknown Collector';
                                                                return (
                                                                    <li key={id} className="text-sm font-medium text-gray-900">
                                                                        • {name}
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>
                                                )}
                                                {assignmentData.crewId && (
                                                    <div>
                                                        <p className="text-sm text-gray-600 mb-2">Crew:</p>
                                                        {(() => {
                                                            const crew = allCrews.find((c: any) => c.id === assignmentData.crewId);
                                                            const name = crew?.name ||
                                                                (order.crewId === assignmentData.crewId ? order.crew?.name : null) ||
                                                                'Selected Crew';
                                                            const members = crew?.members?.length ||
                                                                (order.crewId === assignmentData.crewId ? order.crew?.members?.length : 0);

                                                            return (
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {name} {members > 0 ? `(${members} members)` : ''}
                                                                </p>
                                                            );
                                                        })()}
                                                    </div>
                                                )}
                                                {assignmentData.collectorIds.length === 0 && !assignmentData.crewId && (
                                                    <p className="text-gray-600">No team assigned</p>
                                                )}
                                            </div>

                                            {/* Route Information */}
                                            {(assignmentData.routeDistance || assignmentData.routeDuration) && (
                                                <div className="bg-blue-50 rounded-xl p-6">
                                                    <h4 className="font-semibold text-gray-900 mb-4">Route Information</h4>
                                                    <div className="space-y-2">
                                                        {assignmentData.routeDistance && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-gray-600">Distance:</span>
                                                                <span className="text-sm font-semibold text-gray-900">{assignmentData.routeDistance}</span>
                                                            </div>
                                                        )}
                                                        {assignmentData.routeDuration && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm text-gray-600">Estimated Duration:</span>
                                                                <span className="text-sm font-semibold text-gray-900">{assignmentData.routeDuration}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Map with Route Visualization */}
                                        <div className="h-[500px]">
                                            <RouteMap
                                                collectionAddress={order.address}
                                                collectionLat={order.latitude}
                                                collectionLng={order.longitude}
                                                yardAddress={selectedYard?.address || ''}
                                                yardLat={selectedYard?.latitude}
                                                yardLng={selectedYard?.longitude}
                                                onRouteCalculated={handleRouteCalculated}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="px-8 py-6 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 1 || updateOrderMutation.isPending}
                        className="h-12 px-6 rounded-xl"
                    >
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Back
                    </Button>

                    {currentStep < 3 ? (
                        <Button
                            type="button"
                            onClick={handleNext}
                            disabled={isLoading}
                            className="h-12 px-8 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white"
                        >
                            Next
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            disabled={updateOrderMutation.isPending}
                            className="h-12 px-8 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                        >
                            {updateOrderMutation.isPending ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    Assigning...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                    Confirm Assignment
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
