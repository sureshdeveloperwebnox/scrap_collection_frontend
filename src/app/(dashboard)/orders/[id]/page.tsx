'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft,
    Edit2,
    MapPin,
    User,
    Package,
    Clock,
    CheckCircle2,
    DollarSign,
    Calendar,
    Phone,
    Mail,
    Navigation,
    Info,
    History,
    AlertTriangle,
    ArrowRight,
    Monitor,
    ExternalLink,
    ChevronRight,
    Building2,
    FileText,
    Quote,
    PackageSearch,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/Separator';
import {
    OrderStatusBadge,
    PaymentStatusBadge,
} from '@/components/status-badges';
import { OrderAssignmentStepper } from '@/components/order-assignment-stepper';
import { ordersApi, scrapYardsApi, customersApi, crewsApi, scrapApi, leadsApi } from '@/lib/api';
import { Order, ScrapYard, Crew } from '@/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { RouteMap } from '@/components/route-map';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { getImageUrl } from '@/utils/image-utils';
import { Eye } from 'lucide-react';
import { ScrapCollectionCard } from '@/components/scrap-collection-card';

export default function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const queryClient = useQueryClient();
    const [order, setOrder] = useState<Order | null>(null);
    const [yard, setYard] = useState<any | null>(null);
    const [crew, setCrew] = useState<Crew | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
    const [resolvedScrapInfo, setResolvedScrapInfo] = useState<{ category?: string; name?: string }>({});
    const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);

    const fetchOrder = async () => {
        try {
            const response = await ordersApi.getOrder(id);
            const orderData = response.data;

            const convertedOrder: Order = {
                ...orderData,
                pickupTime: orderData.pickupTime ? new Date(orderData.pickupTime) : undefined,
                createdAt: new Date(orderData.createdAt),
                updatedAt: new Date(orderData.updatedAt),
                assignOrders: orderData.assignOrders?.map((ao: any) => ({
                    ...ao,
                    assignedAt: new Date(ao.assignedAt),
                    startTime: ao.startTime ? new Date(ao.startTime) : undefined,
                    endTime: ao.endTime ? new Date(ao.endTime) : undefined,
                    completedAt: ao.completedAt ? new Date(ao.completedAt) : undefined,
                    completionNotes: ao.completionNotes,
                    completionPhotos: ao.completionPhotos,
                })),
            };

            // Populate route info from saved data if available
            if (convertedOrder.routeDistance && convertedOrder.routeDuration) {
                setRouteInfo({
                    distance: convertedOrder.routeDistance,
                    duration: convertedOrder.routeDuration
                });
            }

            // Parallel fetch for additional data that's not included in order response
            const fetchPromises = [];

            // Fetch customer email if missing
            if (!orderData.customerEmail && orderData.customerId) {
                fetchPromises.push(
                    customersApi.getCustomer(orderData.customerId)
                        .then(customerResponse => {
                            if (customerResponse.data?.email) {
                                convertedOrder.customerEmail = customerResponse.data.email;
                            }
                        })
                        .catch(e => console.warn('Could not fetch customer details', e))
                );
            }

            // Fetch scrap details if present
            if (orderData.vehicleDetails?.scrapCategoryId || orderData.vehicleDetails?.scrapNameId) {
                const scrapInfo: { category?: string; name?: string } = {};

                if (orderData.vehicleDetails.scrapCategoryId) {
                    fetchPromises.push(
                        scrapApi.getScrapCategory(orderData.vehicleDetails.scrapCategoryId)
                            .then(res => { scrapInfo.category = res.data.name; })
                            .catch(e => console.warn('Could not fetch scrap category', e))
                    );
                }

                if (orderData.vehicleDetails.scrapNameId) {
                    fetchPromises.push(
                        scrapApi.getScrapName(orderData.vehicleDetails.scrapNameId)
                            .then(res => { scrapInfo.name = res.data.name; })
                            .catch(e => console.warn('Could not fetch scrap name', e))
                    );
                }

                // Wait for scrap info to be fetched before setting
                if (fetchPromises.length > 0) {
                    await Promise.all(fetchPromises);
                    setResolvedScrapInfo(scrapInfo);
                }
            }

            // Set order data (yard and crew are already included in the response)
            setOrder(convertedOrder);

            if (orderData.yard) {
                setYard(orderData.yard);
            }

            if (orderData.crew) {
                setCrew(orderData.crew);
            }

        } catch (error) {
            console.error('Error fetching order:', error);
            toast.error('Failed to load order details');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [id]);

    if (isLoading) {
        return <OrderDetailsSkeleton />;
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-100 shadow-sm animate-in fade-in zoom-in duration-300">
                <div className="p-4 bg-red-50 rounded-full mb-4">
                    <AlertTriangle className="h-12 w-12 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h2>
                <p className="text-gray-500 mb-6 text-center max-w-md">The order you're looking for doesn't exist or has been deleted.</p>
                <Button onClick={() => router.push('/orders')} variant="outline" className="border-cyan-200">
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back to Orders
                </Button>
            </div>
        );
    }

    const orderDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const assignedCollectors = order.assignOrders?.filter(ao => ao.collector).map(ao => ({
        ...ao.collector!,
        assignment: {
            ...ao,
            id: ao.id,
            status: ao.status,
            startTime: ao.startTime,
            endTime: ao.endTime,
            completedAt: ao.completedAt,
            notes: ao.notes,
            completionNotes: ao.completionNotes || (ao as any).completion_notes,
            completionPhotos: ao.completionPhotos || (ao as any).completion_photos
        }
    })) || [];

    if (assignedCollectors.length === 0 && order.assignedCollector) {
        assignedCollectors.push({ ...order.assignedCollector, assignment: undefined } as any);
    }

    // Crews logic
    const assignedCrews = order.assignOrders?.filter(ao => ao.crew).map(ao => ({
        ...ao.crew!,
        assignment: {
            ...ao,
            id: ao.id,
            status: ao.status,
            startTime: ao.startTime,
            endTime: ao.endTime,
            completedAt: ao.completedAt,
            notes: ao.notes,
            completionNotes: ao.completionNotes || (ao as any).completion_notes,
            completionPhotos: ao.completionPhotos || (ao as any).completion_photos
        }
    })) || [];

    if (assignedCrews.length === 0 && (order.crew || crew)) {
        const c = order.crew || crew;
        if (c) assignedCrews.push({ ...c, assignment: undefined } as any);
    }

    return (
        <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/orders')}
                        className="rounded-full h-10 w-10 p-0 hover:bg-gray-100"
                    >
                        <ChevronLeft className="h-5 w-5 text-gray-500" />
                    </Button>
                    <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                                Order <span className="text-cyan-500">#{order.orderNumber || order.id.slice(0, 8)}</span>
                            </h1>
                            <OrderStatusBadge status={order.orderStatus} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                            <Calendar className="h-3.5 w-3.5" />
                            Placed on {orderDate}
                            <span className="mx-0.5">•</span>
                            <div className="flex items-center gap-1.5 text-cyan-600 font-semibold">
                                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                                Live Tracking
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => router.push(`/orders?edit=${order.id}`)}
                        className="h-11 bg-white hover:bg-gray-50 text-gray-900 shadow-xl shadow-gray-200/50 font-black px-6 rounded-2xl border border-gray-100 transition-all hover:scale-105 active:scale-95"
                    >
                        <Edit2 className="h-4 w-4 mr-2 text-cyan-500" />
                        EDIT ORDER
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    {/* Map Section */}
                    <Card className="border-none shadow-sm overflow-hidden bg-white">
                        <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/30">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                    <Navigation className="h-4 w-4 text-cyan-500" />
                                    Live Collection Route
                                </CardTitle>
                                {routeInfo && (
                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em] mb-0.5">Distance</span>
                                            <span className="text-sm font-black text-cyan-600">{routeInfo.distance}</span>
                                        </div>
                                        <Separator orientation="vertical" className="h-8 bg-gray-200 w-[1px]" />
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em] mb-0.5">Duration</span>
                                            <span className="text-sm font-black text-emerald-600">{routeInfo.duration}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="h-[480px]">
                                <RouteMap
                                    collectionAddress={order.address}
                                    collectionLat={order.latitude}
                                    collectionLng={order.longitude}
                                    yardAddress={yard?.address || ''}
                                    yardLat={yard?.latitude}
                                    yardLng={yard?.longitude}
                                    onRouteCalculated={(dist, dur) => setRouteInfo({ distance: dist, duration: dur })}
                                />
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-50">
                                <div className="flex gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="h-5 w-5 text-cyan-600" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Collection Point</p>
                                        <p className="text-sm font-semibold text-gray-900 leading-snug">{order.address}</p>
                                        <p className="text-xs text-gray-500">Requestor: {order.customerName}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className={cn(
                                        "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                                        yard ? "bg-emerald-50" : "bg-gray-100"
                                    )}>
                                        <Building2 className={cn("h-5 w-5", yard ? "text-emerald-600" : "text-gray-400")} />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Scrap Yard</p>
                                        <p className={cn("text-sm font-semibold leading-snug", yard ? "text-gray-900" : "text-gray-400 italic")}>
                                            {yard?.address || 'Pending Yard Assignment'}
                                        </p>
                                        <div className="mt-1 flex items-center justify-between">
                                            {yard ? (
                                                <span className="text-xs text-emerald-600 font-bold uppercase tracking-tight">{yard.yardName}</span>
                                            ) : (
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    onClick={() => setIsAssignmentOpen(true)}
                                                    className="p-0 h-auto text-[10px] font-bold text-cyan-600"
                                                >
                                                    [Assign Now]
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Details & Progress Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                        <div className="space-y-6">
                            <Card className="border-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.06)] bg-white overflow-hidden rounded-[2.5rem] group">
                                <div className="h-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-300" />
                                <CardHeader className="pb-3 px-10 pt-8">
                                    <CardTitle className="text-sm font-black text-gray-900 flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-200 group-hover:rotate-12 transition-transform duration-500">
                                            <Package className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="uppercase tracking-[0.2em] text-[10px] text-cyan-600">Asset Data</span>
                                            <span className="text-xl tracking-tight">Scrap Info</span>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-10 pb-10 pt-4 space-y-6">
                                    <div className="grid grid-cols-2 gap-y-6 gap-x-8">
                                        <DetailItem label="Asset Make" value={order.vehicleDetails.make} />
                                        <DetailItem label="Model Variant" value={order.vehicleDetails.model} />
                                        {resolvedScrapInfo.category && (
                                            <DetailItem label="Material Class" value={resolvedScrapInfo.category} color="purple" badge />
                                        )}
                                        {resolvedScrapInfo.name && (
                                            <DetailItem label="Descriptor" value={resolvedScrapInfo.name} color="cyan" badge />
                                        )}
                                    </div>
                                    {order.vehicleDetails.description && (
                                        <div className="pt-2 border-t border-gray-50">
                                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Description</p>
                                            <p className="text-sm text-gray-600 font-medium">"{order.vehicleDetails.description}"</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {(assignedCollectors.length > 0 || assignedCrews.length > 0) && (
                                <Card className="border-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] bg-white overflow-hidden rounded-[2.5rem] transition-all duration-700 hover:shadow-[0_45px_100px_-20px_rgba(59,130,246,0.1)]">
                                    <div className="h-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-300" />
                                    <CardHeader className="pb-3 px-10 pt-8">
                                        <CardTitle className="text-sm font-black text-gray-900 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                                    <User className="h-5 w-5 text-white" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="uppercase tracking-[0.2em] text-[10px] text-cyan-600">Operational Unit</span>
                                                    <span className="text-xl tracking-tight">Personnel Dispatch</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active Status</span>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-10 pb-10 pt-4 space-y-6">
                                        {assignedCollectors.map((collector, index) => (
                                            <div key={collector.id} className="relative group p-6 rounded-[2rem] bg-gradient-to-br from-white to-gray-50/50 border border-gray-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 overflow-hidden">
                                                {/* Background Accent */}
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors duration-500" />

                                                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                                                    <div className="relative h-16 w-16 shrink-0">
                                                        <div className="absolute inset-0 bg-blue-500/10 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500" />
                                                        <div className="absolute inset-0 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-blue-600 font-bold text-2xl z-10 group-hover:scale-105 transition-transform duration-500">
                                                            {collector.fullName.charAt(0).toUpperCase()}
                                                        </div>
                                                        {index === 0 && (
                                                            <div className="absolute -top-1 -right-1 h-5 w-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center z-20 shadow-lg">
                                                                <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                                            <p
                                                                className="text-lg font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors uppercase tracking-tight"
                                                                onClick={() => router.push(`/employees?view=${collector.id}&returnTo=/orders/${order.id}`)}
                                                            >
                                                                {collector.fullName}
                                                            </p>
                                                            {index === 0 && (
                                                                <Badge className="bg-blue-600/10 text-blue-700 hover:bg-blue-600/20 text-[8px] font-black px-2.5 py-1 rounded-lg border-none uppercase tracking-[0.1em]">
                                                                    Mission Lead
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                                                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold uppercase tracking-wide">
                                                                <Mail className="h-3 w-3 text-blue-400" />
                                                                {collector.email}
                                                            </div>
                                                            {collector.phone && (
                                                                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold uppercase tracking-wide">
                                                                    <Phone className="h-3 w-3 text-emerald-400" />
                                                                    {collector.phone}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {(collector as any).assignment && (collector as any).assignment.status && (
                                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                            <Badge className={cn(
                                                                "px-3 py-1 text-[9px] font-black uppercase tracking-widest border-none shadow-sm",
                                                                (collector as any).assignment.status === 'COMPLETED' ? "bg-emerald-500 text-white" :
                                                                    (collector as any).assignment.status === 'IN_PROGRESS' ? "bg-cyan-500 text-white animate-pulse" :
                                                                        "bg-gray-400 text-white"
                                                            )}>
                                                                {(collector as any).assignment.status}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>

                                                {(collector as any).assignment && (
                                                    <div className="space-y-4">
                                                        {/* Mission Stats Bar */}
                                                        <div className="grid grid-cols-2 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
                                                            {(collector as any).assignment.startTime && (
                                                                <div className="bg-white/50 backdrop-blur-sm px-4 py-3 flex items-center gap-3 group/stat">
                                                                    <div className="h-8 w-8 rounded-xl bg-cyan-50 flex items-center justify-center group-hover/stat:bg-cyan-100 transition-colors">
                                                                        <Clock className="h-3.5 w-3.5 text-cyan-500" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Mission Start</p>
                                                                        <p className="text-xs font-bold text-gray-800">
                                                                            {new Date((collector as any).assignment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {(collector as any).assignment.endTime && (
                                                                <div className="bg-white/50 backdrop-blur-sm px-4 py-3 flex items-center gap-3 group/stat border-l border-gray-100">
                                                                    <div className="h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center group-hover/stat:bg-orange-100 transition-colors">
                                                                        <ArrowRight className="h-3.5 w-3.5 text-orange-500" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">End Time</p>
                                                                        <p className="text-xs font-bold text-gray-800">
                                                                            {new Date((collector as any).assignment.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Notes Sections */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                                            {(collector as any).assignment.notes && (
                                                                <div className="relative p-5 rounded-2xl bg-white border border-blue-100 shadow-sm overflow-hidden group/note">
                                                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/note:opacity-20 transition-opacity">
                                                                        <Info className="h-8 w-8 text-blue-500" />
                                                                    </div>
                                                                    <p className="text-[8px] font-black text-blue-900 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                                                        Tac-Directives
                                                                    </p>
                                                                    <p className="text-xs text-blue-900 font-semibold leading-relaxed">
                                                                        {(collector as any).assignment.notes}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {((collector as any).assignment.completionNotes || (collector as any).assignment.completion_notes) && (
                                                                <div className="relative p-5 rounded-2xl bg-emerald-50 border border-emerald-100 shadow-sm overflow-hidden group/note md:col-span-1">
                                                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/note:opacity-20 transition-opacity">
                                                                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                                                    </div>
                                                                    <p className="text-[8px] font-black text-emerald-900 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                                        Mission Feedback
                                                                    </p>
                                                                    <p className="text-xs text-emerald-900 font-bold italic leading-relaxed">
                                                                        "{(collector as any).assignment.completionNotes || (collector as any).assignment.completion_notes}"
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Documentation Grid */}
                                                        {((collector as any).assignment.completionPhotos || (collector as any).assignment.completion_photos) &&
                                                            ((collector as any).assignment.completionPhotos || (collector as any).assignment.completion_photos).length > 0 && (
                                                                <div className="mt-4 text-left">
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                                                            <PackageSearch className="h-3.5 w-3.5 text-gray-400" />
                                                                            Mission Documentation ({((collector as any).assignment.completionPhotos || (collector as any).assignment.completion_photos).length})
                                                                        </p>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                                        {((collector as any).assignment.completionPhotos || (collector as any).assignment.completion_photos).map((photo: string, photoIndex: number) => {
                                                                            const photoUrl = getImageUrl(photo);
                                                                            return (
                                                                                <a
                                                                                    key={photoIndex}
                                                                                    href={photoUrl}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500"
                                                                                >
                                                                                    <img
                                                                                        src={photoUrl}
                                                                                        alt={`Documentation ${photoIndex + 1}`}
                                                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                                                        onError={(e) => {
                                                                                            (e.target as HTMLImageElement).parentElement?.classList.add('bg-blue-50');
                                                                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="8" font-weight="bold" uppercase="true"%3E404: Asset Missing%3C/text%3E%3C/svg%3E';
                                                                                        }}
                                                                                    />
                                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                                                                        <div className="flex items-center gap-2 text-[8px] font-black text-white uppercase tracking-widest bg-white/20 backdrop-blur-md rounded-lg px-2 py-1 border border-white/30">
                                                                                            <Eye className="h-3 w-3" />
                                                                                            Details
                                                                                        </div>
                                                                                    </div>
                                                                                </a>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {assignedCrews.map((crewItem, index) => (
                                            <div key={crewItem.id} className="relative group p-6 rounded-[2rem] bg-gradient-to-br from-white to-gray-50/50 border border-gray-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 overflow-hidden">
                                                {/* Background Accent */}
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors duration-500" />

                                                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                                                    <div className="relative h-16 w-16 shrink-0">
                                                        <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500" />
                                                        <div className="absolute inset-0 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-emerald-600 z-10 group-hover:scale-105 transition-transform duration-500">
                                                            <Users className="h-8 w-8" />
                                                        </div>
                                                        <div className="absolute -bottom-1 -right-1 h-7 w-7 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center z-20 shadow-lg text-[10px] font-black text-white">
                                                            {crewItem.members?.length || 0}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                                            <p className="text-lg font-bold text-gray-900 cursor-default uppercase tracking-tight">
                                                                {crewItem.name}
                                                            </p>
                                                            <Badge className="bg-emerald-600/10 text-emerald-700 hover:bg-emerald-600/20 text-[8px] font-black px-2.5 py-1 rounded-lg border-none uppercase tracking-[0.1em]">
                                                                Tactical Unit
                                                            </Badge>
                                                        </div>
                                                        <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-md">
                                                            {crewItem.description || 'Specialized disposal and collection crew.'}
                                                        </p>
                                                    </div>

                                                    {(crewItem as any).assignment && (crewItem as any).assignment.status && (
                                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                            <Badge className={cn(
                                                                "px-3 py-1 text-[9px] font-black uppercase tracking-widest border-none shadow-sm",
                                                                (crewItem as any).assignment.status === 'COMPLETED' ? "bg-emerald-500 text-white" :
                                                                    (crewItem as any).assignment.status === 'IN_PROGRESS' ? "bg-cyan-500 text-white animate-pulse" :
                                                                        "bg-gray-400 text-white"
                                                            )}>
                                                                {(crewItem as any).assignment.status}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>

                                                {(crewItem as any).assignment && (
                                                    <div className="space-y-4">
                                                        {/* Mission Stats Bar */}
                                                        <div className="grid grid-cols-2 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
                                                            {(crewItem as any).assignment.startTime && (
                                                                <div className="bg-white/50 backdrop-blur-sm px-4 py-3 flex items-center gap-3 group/stat">
                                                                    <div className="h-8 w-8 rounded-xl bg-cyan-50 flex items-center justify-center group-hover/stat:bg-cyan-100 transition-colors">
                                                                        <Clock className="h-3.5 w-3.5 text-cyan-500" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Mission Start</p>
                                                                        <p className="text-xs font-bold text-gray-800">
                                                                            {new Date((crewItem as any).assignment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {(crewItem as any).assignment.endTime && (
                                                                <div className="bg-white/50 backdrop-blur-sm px-4 py-3 flex items-center gap-3 group/stat border-l border-gray-100">
                                                                    <div className="h-8 w-8 rounded-xl bg-orange-50 flex items-center justify-center group-hover/stat:bg-orange-100 transition-colors">
                                                                        <ArrowRight className="h-3.5 w-3.5 text-orange-500" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">End Time</p>
                                                                        <p className="text-xs font-bold text-gray-800">
                                                                            {new Date((crewItem as any).assignment.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Unit Roster */}
                                                        {crewItem.members && crewItem.members.length > 0 && (
                                                            <div className="flex -space-x-2.5 overflow-hidden p-1">
                                                                {crewItem.members.slice(0, 5).map((member, i) => (
                                                                    <div
                                                                        key={member.id}
                                                                        className="h-10 w-10 rounded-xl bg-white border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-black text-emerald-600 hover:scale-110 hover:-translate-y-1 transition-all cursor-pointer ring-1 ring-emerald-50"
                                                                        title={member.fullName}
                                                                        onClick={() => router.push(`/employees?view=${member.id}&returnTo=/orders/${order.id}`)}
                                                                    >
                                                                        {member.fullName.charAt(0).toUpperCase()}
                                                                    </div>
                                                                ))}
                                                                {crewItem.members.length > 5 && (
                                                                    <div className="h-10 w-10 rounded-xl bg-emerald-50 border-2 border-white shadow-sm flex items-center justify-center text-[8px] font-black text-emerald-600">
                                                                        +{crewItem.members.length - 5}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Notes Sections */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                                            {(crewItem as any).assignment.notes && (
                                                                <div className="relative p-5 rounded-2xl bg-white border border-emerald-100 shadow-sm overflow-hidden group/note">
                                                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/note:opacity-20 transition-opacity">
                                                                        <Info className="h-8 w-8 text-emerald-500" />
                                                                    </div>
                                                                    <p className="text-[8px] font-black text-emerald-900 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                                        Tac-Directives
                                                                    </p>
                                                                    <p className="text-xs text-emerald-900 font-semibold leading-relaxed">
                                                                        {(crewItem as any).assignment.notes}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {(crewItem as any).assignment.completionNotes && (
                                                                <div className="relative p-5 rounded-2xl bg-green-50/50 backdrop-blur-sm border border-green-100 shadow-sm overflow-hidden group/note">
                                                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/note:opacity-20 transition-opacity">
                                                                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                                                                    </div>
                                                                    <p className="text-[8px] font-black text-green-900 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                                                        Mission Feedback
                                                                    </p>
                                                                    <p className="text-xs text-green-900 font-bold italic leading-relaxed">
                                                                        "{(crewItem as any).assignment.completionNotes}"
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Documentation Grid */}
                                                        {(crewItem as any).assignment.completionPhotos && (crewItem as any).assignment.completionPhotos.length > 0 && (
                                                            <div className="mt-4 text-left">
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                                    <PackageSearch className="h-3.5 w-3.5 text-gray-400" />
                                                                    Mission Documentation ({(crewItem as any).assignment.completionPhotos.length})
                                                                </p>
                                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                                    {(crewItem as any).assignment.completionPhotos.map((photo: string, photoIndex: number) => {
                                                                        const photoUrl = getImageUrl(photo);
                                                                        return (
                                                                            <a
                                                                                key={photoIndex}
                                                                                href={photoUrl}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-500"
                                                                            >
                                                                                <img
                                                                                    src={photoUrl}
                                                                                    alt={`Documentation ${photoIndex + 1}`}
                                                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                                                    onError={(e) => {
                                                                                        (e.target as HTMLImageElement).parentElement?.classList.add('bg-emerald-50');
                                                                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="8" font-weight="bold" uppercase="true"%3E404: Asset Missing%3C/text%3E%3C/svg%3E';
                                                                                    }}
                                                                                />
                                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                                                                                    <div className="flex items-center gap-2 text-[8px] font-black text-white uppercase tracking-widest bg-white/20 backdrop-blur-md rounded-lg px-2 py-1 border border-white/30">
                                                                                        <Eye className="h-3 w-3" />
                                                                                        Details
                                                                                    </div>
                                                                                </div>
                                                                            </a>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Scrap Collection Forms Card */}
                            <ScrapCollectionCard workOrderId={order.id} />
                        </div>

                        <Card className="border-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.06)] bg-white overflow-hidden rounded-[2.5rem] group">
                            <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300" />
                            <CardHeader className="pb-3 px-10 pt-8">
                                <CardTitle className="text-sm font-black text-gray-900 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:rotate-12 transition-transform duration-500">
                                        <History className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="uppercase tracking-[0.2em] text-[10px] text-emerald-600">Event History</span>
                                        <span className="text-xl tracking-tight">Status Timeline</span>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-10 pb-10 pt-6">
                                <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-gray-100 before:to-gray-100">
                                    <PipelineItem
                                        title="Order Received"
                                        time={orderDate}
                                        status="completed"
                                        isFirst
                                    />
                                    <PipelineItem
                                        title="Deployment"
                                        time={(() => {
                                            const name = assignedCrews.length > 0 ? assignedCrews[0].name : (assignedCollectors.length > 0 ? assignedCollectors[0].fullName : 'Awaiting Crew');
                                            const assignment = assignedCrews.length > 0 ? (assignedCrews[0] as any).assignment : (assignedCollectors.length > 0 ? (assignedCollectors[0] as any).assignment : null);
                                            const timeStr = assignment?.assignedAt ? new Date(assignment.assignedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                                            return timeStr ? `${name} • ${timeStr}` : name;
                                        })()}
                                        status={assignedCollectors.length > 0 || assignedCrews.length > 0 ? 'completed' : 'pending'}
                                        action={(
                                            <Button variant="link" size="sm" onClick={() => setIsAssignmentOpen(true)} className="p-0 h-auto text-[10px] font-black text-cyan-600 uppercase tracking-widest hover:text-cyan-700 transition-colors">
                                                {assignedCollectors.length > 0 || assignedCrews.length > 0 ? '[Modify]' : '[Activate]'}
                                            </Button>
                                        )}
                                    />
                                    <PipelineItem
                                        title="Collection Active"
                                        time={order.orderStatus === 'IN_PROGRESS' || order.orderStatus === 'COMPLETED' ? 'LIVE' : 'QUEUE'}
                                        status={order.orderStatus === 'IN_PROGRESS' || order.orderStatus === 'COMPLETED' ? 'current' : 'waiting'}
                                    />
                                    <PipelineItem
                                        title="Final Settlement"
                                        time={order.orderStatus === 'COMPLETED' ? 'Finalized' : 'EST'}
                                        status={order.orderStatus === 'COMPLETED' ? 'completed' : 'waiting'}
                                        isLast
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Column: Customer & Payment */}
                <div className="space-y-6">
                    <Card className="border-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.06)] bg-white overflow-hidden rounded-[2.5rem] group">
                        <div className="h-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-300" />
                        <CardHeader className="pb-3 px-10 pt-8">
                            <CardTitle className="text-sm font-black text-gray-900 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-200 group-hover:rotate-12 transition-transform duration-500">
                                    <User className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="uppercase tracking-[0.2em] text-[10px] text-cyan-600">Client Profile</span>
                                    <span className="text-xl tracking-tight">Customer Info</span>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-10 pb-10 pt-4">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4 group">
                                    <div className="h-14 w-14 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600 font-bold text-xl shadow-inner border border-cyan-100 group-hover:bg-cyan-100 transition-colors">
                                        {order.customerName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div>
                                            <h2
                                                className="text-sm font-bold text-gray-900 uppercase tracking-tight cursor-pointer hover:text-cyan-600 transition-colors"
                                                onClick={() => router.push(`/customers?view=${order.customerId}&returnTo=/orders/${order.id}`)}
                                            >
                                                {order.customerName}
                                            </h2>
                                        </div>
                                        <div className="flex flex-col gap-1.5 mt-2">

                                            {order.customerEmail && (
                                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold truncate">
                                                    <div className="h-5 w-5 rounded-md bg-gray-50 flex items-center justify-center border border-gray-100">
                                                        <Mail className="h-3 w-3 text-cyan-500" />
                                                    </div>
                                                    {order.customerEmail}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full h-10 border-gray-100 font-bold tracking-tight text-[10px] uppercase hover:bg-gray-50 hover:text-cyan-600 hover:border-cyan-100 transition-all rounded-lg"
                                    onClick={() => router.push(`/customers?view=${order.customerId}&returnTo=/orders/${order.id}`)}
                                >
                                    Customer PROFILE
                                    <ChevronRight className="h-3.5 w-3.5 ml-2" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.06)] bg-white overflow-hidden rounded-[2.5rem] group">
                        <div className="h-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-300" />
                        <CardHeader className="pb-3 px-10 pt-8">
                            <CardTitle className="text-sm font-black text-gray-900 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg shadow-cyan-200 group-hover:rotate-12 transition-transform duration-500">
                                    <FileText className="h-5 w-5 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="uppercase tracking-[0.2em] text-[10px] text-cyan-600">Mission Brief</span>
                                    <span className="text-xl tracking-tight">Order Description</span>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-10 pb-10 pt-4">
                            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-cyan-50/50 to-teal-50/30 border border-cyan-100/50 backdrop-blur-sm overflow-hidden group/desc">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover/desc:bg-cyan-500/10 transition-colors duration-500" />
                                <Quote className="absolute top-3 left-3 h-6 w-6 text-cyan-200/50" />
                                <div className="relative">
                                    {order.instructions ? (
                                        <p className="text-sm font-medium text-gray-700 leading-relaxed italic pl-4">
                                            "{order.instructions}"
                                        </p>
                                    ) : (
                                        <p className="text-sm font-medium text-gray-400 leading-relaxed italic pl-4">
                                            No description available.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {order.photos && order.photos.length > 0 && (
                        <Card className="border-none shadow-sm bg-white overflow-hidden">
                            <div className="h-1 bg-cyan-500" />
                            <CardHeader className="pb-3 px-6 pt-5">
                                <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                    <Package className="h-4 w-4 text-cyan-500" />
                                    Scrap Images
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-6 py-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {order.photos.map((photo, index) => {
                                        const imageUrl = getImageUrl(photo);
                                        return (
                                            <div key={index} className="relative group aspect-square rounded-xl border border-gray-100 overflow-hidden bg-gray-50/50 shadow-sm hover:shadow-md transition-all duration-300">
                                                <img
                                                    src={imageUrl}
                                                    alt={`Scrap image ${index + 1}`}
                                                    className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-500"
                                                    onClick={() => window.open(imageUrl, '_blank')}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="10"%3EImage Error%3C/text%3E%3C/svg%3E';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-2">
                                                    <span className="text-[8px] font-bold text-white uppercase tracking-widest bg-black/20 backdrop-blur-md px-2 py-1 rounded-full border border-white/20">
                                                        View Full Image
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <OrderAssignmentStepper
                isOpen={isAssignmentOpen}
                onClose={() => setIsAssignmentOpen(false)}
                order={order}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['orders'] });
                    fetchOrder();
                }}
            />
        </div>
    );
}

function DetailItem({ label, value, badge = false, color = 'cyan', span = 1 }: { label: string, value?: string, badge?: boolean, color?: string, span?: number }) {
    if (!value && !badge) return null;
    return (
        <div className={cn(span === 2 ? 'col-span-2' : '', "space-y-1.5")}>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{label}</p>
            {badge ? (
                <Badge className={cn("px-3 py-1.5 text-[10px] font-black uppercase tracking-wider border-none",
                    color === 'orange' ? "bg-orange-50 text-orange-700 hover:bg-orange-100" :
                        color === 'purple' ? "bg-purple-50 text-purple-700 hover:bg-purple-100" :
                            "bg-cyan-50 text-cyan-700 hover:bg-cyan-100"
                )}>
                    {value || 'N/A'}
                </Badge>
            ) : (
                <p className="text-sm font-black text-gray-900 tracking-tight truncate">{value || 'N/A'}</p>
            )}
        </div>
    );
}

function ContactItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-center gap-4 p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-cyan-200 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 group">
            <div className="h-11 w-11 rounded-xl flex items-center justify-center bg-white text-cyan-600 shadow-sm border border-gray-50 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div className="text-left flex-1 min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</p>
                <p className="text-sm font-black text-gray-800 truncate tracking-tight">{value}</p>
            </div>
        </div>
    );
}

function PipelineItem({ title, time, status, isFirst = false, isLast = false, action }: { title: string, time: string, status: 'completed' | 'current' | 'pending' | 'waiting', isFirst?: boolean, isLast?: boolean, action?: React.ReactNode }) {
    return (
        <div className="flex gap-6 group">
            <div className="flex flex-col items-center">
                <div className={cn(
                    "h-8 w-8 rounded-xl flex items-center justify-center border-2 transition-all duration-500 z-10 shrink-0 shadow-sm",
                    status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-200" :
                        status === 'current' ? "bg-white border-cyan-500 text-cyan-500 animate-ring" :
                            "bg-white border-gray-100 text-gray-300"
                )}>
                    {status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
                        status === 'current' ? <Clock className="h-4 w-4" /> :
                            <div className="h-1.5 w-1.5 rounded-full bg-gray-200" />}
                </div>
                {!isLast && (
                    <div className={cn(
                        "w-0.5 h-full min-h-[40px] -mt-1 -mb-1",
                        status === 'completed' ? "bg-gradient-to-b from-emerald-500 to-gray-200" : "bg-gray-100"
                    )} />
                )}
            </div>
            <div className="pt-0.5 pb-8 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-1">
                    <p className={cn(
                        "text-xs font-black uppercase tracking-[0.1em]",
                        status === 'waiting' || status === 'pending' ? "text-gray-400" : "text-gray-900"
                    )}>
                        {title}
                    </p>
                    {action && <div className="shrink-0">{action}</div>}
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{time || (status === 'pending' ? 'Pending' : '')}</p>
            </div>
        </div>
    );
}

function OrderDetailsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse p-8">
            <div className="flex justify-between items-center mb-8">
                <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <Skeleton className="h-[480px] w-full rounded-xl" />
                    <div className="grid grid-cols-2 gap-6">
                        <Skeleton className="h-64 w-full rounded-xl" />
                        <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-80 w-full rounded-xl" />
                    <Skeleton className="h-80 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}
