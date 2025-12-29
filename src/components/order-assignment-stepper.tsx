'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEmployees } from '@/hooks/use-employees';
import { useCrews } from '@/hooks/use-crews';
import { useScrapYards } from '@/hooks/use-scrap-yards';
import { useUpdateOrder, useAssignCollector } from '@/hooks/use-orders';
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
    Loader2,
    Clock,
    Info
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
    startTime?: string;
    endTime?: string;
    notes?: string;
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
        collectorIds: (order as any).assignOrders
            ? (order as any).assignOrders.map((ao: any) => ao.collectorId).filter((id: any) => !!id)
            : (order.assignedCollectorId ? [order.assignedCollectorId] : []),
        crewId: order.crewId || '',
        startTime: (order as any).assignOrders?.[0]?.startTime
            ? new Date((order as any).assignOrders[0].startTime).toISOString().slice(0, 16)
            : undefined,
        endTime: (order as any).assignOrders?.[0]?.endTime
            ? new Date((order as any).assignOrders[0].endTime).toISOString().slice(0, 16)
            : undefined,
        notes: (order as any).assignOrders?.[0]?.notes || '',
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

    const assignOrderMutation = useAssignCollector();

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

    const handleRouteCalculated = useCallback((distance: string, duration: string) => {
        setAssignmentData(prev => {
            if (prev.routeDistance === distance && prev.routeDuration === duration) return prev;
            return {
                ...prev,
                routeDistance: distance,
                routeDuration: duration,
            };
        });
    }, []);

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
            await assignOrderMutation.mutateAsync({
                orderId: order.id,
                data: {
                    yardId: assignmentData.yardId,
                    collectorIds: assignmentData.collectorIds,
                    crewId: assignmentData.crewId || undefined,
                    startTime: assignmentData.startTime ? new Date(assignmentData.startTime).toISOString() : undefined,
                    endTime: assignmentData.endTime ? new Date(assignmentData.endTime).toISOString() : undefined,
                    notes: assignmentData.notes,
                    routeDistance: assignmentData.routeDistance,
                    routeDuration: assignmentData.routeDuration,
                },
            });

            toast.success(`Order assigned successfully!`);
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
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] sm:max-w-[1400px] max-h-[95vh] bg-white border-0 shadow-2xl rounded-2xl p-0 flex flex-col [&>button]:hidden text-left"
                onInteractOutside={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <DialogHeader className="px-4 sm:px-6 lg:px-8 pt-8 pb-6 border-b border-gray-200 flex-shrink-0">
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
                            disabled={assignOrderMutation.isPending}
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

                <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 lg:px-8 py-6">
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
                                                    onClick={() => setAssignmentData({ ...assignmentData, yardId: yard.id })}
                                                    className={`p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer shadow-sm relative overflow-hidden group ${isSelected
                                                        ? 'border-cyan-500 bg-cyan-50/50 shadow-cyan-500/10'
                                                        : 'border-gray-100 bg-white hover:border-cyan-200 hover:shadow-md'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${isSelected ? 'bg-cyan-500 shadow-lg shadow-cyan-200' : 'bg-gray-100'
                                                                }`}>
                                                                <Building2 className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                                                            </div>
                                                            <div>
                                                                <h4 className="text-base font-black text-gray-900 tracking-tight">{yard.yardName}</h4>
                                                                {distance && (
                                                                    <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest flex items-center gap-1.5 mt-1">
                                                                        <Navigation className="h-3 w-3" />
                                                                        {distance} km away
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="bg-cyan-500 rounded-full p-1 shadow-sm">
                                                                <CheckCircle2 className="h-5 w-5 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-500 leading-snug mb-3">{yard.address}</p>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-tighter">
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
                                                        className={`p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer shadow-sm relative overflow-hidden group ${isSelected
                                                            ? 'border-cyan-500 bg-cyan-50/50 shadow-cyan-500/10'
                                                            : 'border-gray-100 bg-white hover:border-cyan-200 hover:shadow-md'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() => handleCollectorToggle(collector.id)}
                                                                className="h-5 w-5 rounded-lg border-2 border-gray-200 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-base font-black text-gray-900 tracking-tight truncate">{collector.fullName}</h4>
                                                                <p className="text-xs font-medium text-gray-500 truncate">{collector.email}</p>
                                                                <div className="mt-2 text-[10px] font-black text-cyan-600 uppercase tracking-widest bg-cyan-50 w-fit px-2 py-0.5 rounded-md">
                                                                    {collector.workZone || 'External Taskforce'}
                                                                </div>
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

                                    {/* Mission Details */}
                                    <div className="mt-8 pt-8 border-t border-gray-100">
                                        <h4 className="text-base font-semibold text-gray-900 mb-4">Mission Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="startTime" className="text-sm font-medium text-gray-700">Scheduled Start Time</Label>
                                                <input
                                                    type="datetime-local"
                                                    id="startTime"
                                                    value={assignmentData.startTime || ''}
                                                    onChange={(e) => setAssignmentData(prev => ({ ...prev, startTime: e.target.value }))}
                                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="endTime" className="text-sm font-medium text-gray-700">Expected End Time</Label>
                                                <input
                                                    type="datetime-local"
                                                    id="endTime"
                                                    value={assignmentData.endTime || ''}
                                                    onChange={(e) => setAssignmentData(prev => ({ ...prev, endTime: e.target.value }))}
                                                    className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm"
                                                />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Internal Tactical Notes</Label>
                                                <textarea
                                                    id="notes"
                                                    value={assignmentData.notes || ''}
                                                    onChange={(e) => setAssignmentData(prev => ({ ...prev, notes: e.target.value }))}
                                                    placeholder="Priority instructions, site-specific hazards, or gate codes..."
                                                    className="w-full min-h-[100px] px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all text-sm resize-none"
                                                />
                                            </div>
                                        </div>
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

                                            <div className="bg-emerald-50 rounded-[1.5rem] p-6 border border-emerald-100/50 relative overflow-hidden group">
                                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                                    <Users className="h-10 w-10 text-emerald-600" />
                                                </div>
                                                <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-4">Assigned Team & Timing</h4>

                                                <div className="space-y-4">
                                                    {(assignmentData.collectorIds.length > 0 || assignmentData.crewId) ? (
                                                        <div className="space-y-3">
                                                            {assignmentData.collectorIds.length > 0 && (
                                                                <div>
                                                                    <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest mb-1.5">Collectors</p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {assignmentData.collectorIds.map(id => {
                                                                            const collector = allCollectors.find((c: any) => c.id === id);
                                                                            const name = collector?.fullName || (order.assignedCollectorId === id ? order.assignedCollector?.fullName : null) || 'Unknown Collector';
                                                                            return (
                                                                                <Badge key={id} className="bg-white text-emerald-700 text-[10px] font-bold py-1 px-3 border border-emerald-100 rounded-lg shadow-sm">
                                                                                    {name}
                                                                                </Badge>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {assignmentData.crewId && (
                                                                <div>
                                                                    <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest mb-1.5">Tactical Unit</p>
                                                                    {(() => {
                                                                        const crew = allCrews.find((c: any) => c.id === assignmentData.crewId);
                                                                        const name = crew?.name || (order.crewId === assignmentData.crewId ? order.crew?.name : null) || 'Selected Crew';
                                                                        return (
                                                                            <Badge className="bg-emerald-600 text-white text-[10px] font-bold py-1 px-3 border-none rounded-lg shadow-md">
                                                                                {name}
                                                                            </Badge>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm font-medium text-emerald-600/60 italic">No team assigned yet</p>
                                                    )}

                                                    {(assignmentData.startTime || assignmentData.endTime || assignmentData.notes) && (
                                                        <div className="mt-5 pt-5 border-t border-emerald-200/50 grid grid-cols-2 gap-6">
                                                            {assignmentData.startTime && (
                                                                <div className="space-y-1">
                                                                    <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                                                                        <Clock className="h-3 w-3" />
                                                                        Mission Start
                                                                    </p>
                                                                    <p className="text-xs font-bold text-emerald-900">
                                                                        {new Date(assignmentData.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {assignmentData.endTime && (
                                                                <div className="space-y-1">
                                                                    <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5">
                                                                        <ArrowRight className="h-3 w-3" />
                                                                        End Time
                                                                    </p>
                                                                    <p className="text-xs font-bold text-emerald-900">
                                                                        {new Date(assignmentData.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {assignmentData.notes && (
                                                                <div className="col-span-2 mt-2">
                                                                    <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                                                                        <Info className="h-3 w-3" />
                                                                        Tac-Directives
                                                                    </p>
                                                                    <div className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-emerald-100 text-xs font-medium text-emerald-900 italic leading-relaxed">
                                                                        "{assignmentData.notes}"
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
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
                <div className="px-4 sm:px-6 lg:px-8 py-6 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 1 || assignOrderMutation.isPending}
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
                            disabled={assignOrderMutation.isPending}
                            className="h-12 px-8 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                        >
                            {assignOrderMutation.isPending ? (
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
        </Dialog >
    );
}
