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
    PackageSearch
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
import { DistanceMap } from '@/components/distance-map';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { getImageUrl } from '@/utils/image-utils';
import { Eye } from 'lucide-react';

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
                        className="h-9 bg-cyan-500 hover:bg-cyan-600 text-white shadow-sm font-semibold px-5"
                    >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Order
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
                                            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Distance</span>
                                            <span className="text-sm font-bold text-cyan-600">{routeInfo.distance}</span>
                                        </div>
                                        <Separator orientation="vertical" className="h-8 bg-gray-200 w-[1px]" />
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Duration</span>
                                            <span className="text-sm font-bold text-emerald-600">{routeInfo.duration}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="h-[480px]">
                                {order.latitude && order.longitude ? (
                                    <DistanceMap
                                        origin={{ lat: order.latitude, lng: order.longitude }}
                                        destination={yard?.latitude && yard?.longitude ? { lat: yard.latitude, lng: yard.longitude } : null}
                                        onRouteInfo={setRouteInfo}
                                    />
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center bg-gray-50/50 text-gray-400 p-8 gap-4">
                                        <MapPin className="h-12 w-12 text-gray-200" />
                                        <div className="text-center">
                                            <p className="font-semibold text-gray-700">GPS Coordinates Not Found</p>
                                            <p className="text-xs text-gray-500 mt-1">Update the collection address to enable routing.</p>
                                        </div>
                                    </div>
                                )}
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
                            <Card className="border-none shadow-sm bg-white overflow-hidden">
                                <div className="h-1 bg-cyan-500" />
                                <CardHeader className="pb-3 px-6 pt-5">
                                    <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                        <Package className="h-4 w-4 text-cyan-500" />
                                        Scrap Info
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-6 py-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                                        <DetailItem label="Make" value={order.vehicleDetails.make} />
                                        <DetailItem label="Model" value={order.vehicleDetails.model} />
                                        {resolvedScrapInfo.category && (
                                            <DetailItem label="Scrap Category" value={resolvedScrapInfo.category} color="purple" badge />
                                        )}
                                        {resolvedScrapInfo.name && (
                                            <DetailItem label="Scrap Name" value={resolvedScrapInfo.name} color="cyan" badge />
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

                            {(order.assignedCollector || order.crew || crew) && (
                                <Card className="border-none shadow-sm bg-white overflow-hidden">
                                    <div className="h-1 bg-cyan-500" />
                                    <CardHeader className="pb-3 px-6 pt-5">
                                        <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                            <User className="h-4 w-4 text-cyan-500" />
                                            Assigned Personnel
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-6 py-4 space-y-4">
                                        {order.assignedCollector && (
                                            <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-100">
                                                <div className="h-12 w-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold text-lg">
                                                    {order.assignedCollector.fullName.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <p
                                                        className="text-sm font-bold text-gray-900 cursor-pointer hover:text-cyan-600 transition-colors"
                                                        onClick={() => router.push(`/employees?view=${order.assignedCollector?.id}&returnTo=/orders/${order.id}`)}
                                                    >
                                                        {order.assignedCollector.fullName}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                                                            <Mail className="h-3 w-3" />
                                                            {order.assignedCollector.email}
                                                        </div>
                                                        {order.assignedCollector.phone && (
                                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                                                                <Phone className="h-3 w-3" />
                                                                {order.assignedCollector.phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100 border-none px-3 py-1 text-[10px] font-bold uppercase">
                                                    Lead Collector
                                                </Badge>
                                            </div>
                                        )}

                                        {(order.crew || crew) && (
                                            <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                                                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-lg">
                                                    {(order.crew?.name || crew?.name || 'C').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-900">{order.crew?.name || crew?.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-semibold mt-1">
                                                        Team Assignment • {(order.crew?.members?.length || crew?.members?.length || 0)} Members
                                                    </p>

                                                    {/* List Members */}
                                                    {(order.crew?.members?.length || crew?.members?.length) ? (
                                                        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-emerald-100/50">
                                                            {(order.crew?.members || crew?.members || []).map((member) => (
                                                                <div
                                                                    key={member.id}
                                                                    className="flex items-center gap-1.5 bg-white/60 px-2 py-1 rounded-md border border-emerald-100/50 cursor-pointer hover:border-emerald-300 transition-colors"
                                                                    onClick={() => router.push(`/employees?view=${member.id}&returnTo=/orders/${order.id}`)}
                                                                >
                                                                    <div className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold">
                                                                        {member.fullName.charAt(0).toUpperCase()}
                                                                    </div>
                                                                    <span className="text-[10px] font-medium text-gray-700">{member.fullName}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : null}
                                                </div>
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-1 text-[10px] font-bold uppercase">
                                                    Assigned Crew
                                                </Badge>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <Card className="border-none shadow-sm bg-white overflow-hidden">
                            <div className="h-1 bg-cyan-500" />
                            <CardHeader className="pb-3 px-6 pt-5">
                                <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                    <History className="h-4 w-4 text-cyan-500" />
                                    Order Pipeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-6 py-4">
                                <div className="space-y-6">
                                    <PipelineItem
                                        title="Order Placed"
                                        time={orderDate}
                                        status="completed"
                                        isFirst
                                    />
                                    <PipelineItem
                                        title="Assignment"
                                        time={
                                            order.crew || crew ? `Crew: ${order.crew?.name || crew?.name}` :
                                                order.assignedCollector ? `${order.assignedCollector.fullName} (${order.assignedCollector.email})` :
                                                    'Awaiting Team Selection'
                                        }
                                        status={order.assignedCollectorId || order.crewId ? 'completed' : 'pending'}
                                        action={(
                                            <Button variant="link" size="sm" onClick={() => setIsAssignmentOpen(true)} className="p-0 h-auto text-[10px] font-bold text-cyan-600">
                                                {order.assignedCollectorId || order.crewId ? 'Change' : 'Assign'}
                                            </Button>
                                        )}
                                    />
                                    <PipelineItem
                                        title="Collection"
                                        time={order.orderStatus === 'IN_PROGRESS' || order.orderStatus === 'COMPLETED' ? 'In Progress' : 'Pending'}
                                        status={order.orderStatus === 'IN_PROGRESS' || order.orderStatus === 'COMPLETED' ? 'current' : 'waiting'}
                                    />
                                    <PipelineItem
                                        title="Settlement"
                                        time={order.orderStatus === 'COMPLETED' ? 'Finalized' : 'TBD'}
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
                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <div className="h-1 bg-cyan-500" />
                        <CardHeader className="pb-3 px-6 pt-5">
                            <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                <User className="h-4 w-4 text-cyan-500" />
                                Customer Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-6 pb-6 pt-2">
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
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold">
                                                <div className="h-5 w-5 rounded-md bg-gray-50 flex items-center justify-center border border-gray-100">
                                                    <Phone className="h-3 w-3 text-cyan-500" />
                                                </div>
                                                {order.customerPhone}
                                            </div>
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

                    <Card className="border-none shadow-sm bg-white overflow-hidden">
                        <CardHeader className="pb-3 border-b border-gray-50 px-6 pt-5">
                            <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-cyan-500" />
                                Order Description
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5">
                            <div className="text-xs text-gray-700 p-4 rounded-xl bg-gray-50/30 border border-gray-100 font-medium italic relative min-h-[60px]">
                                <Quote className="absolute -top-1 -left-1 h-3 w-3 text-gray-200" />
                                {order.instructions || 'No description available.'}
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
        </div >
    );
}

function DetailItem({ label, value, badge = false, color = 'cyan', span = 1 }: { label: string, value?: string, badge?: boolean, color?: string, span?: number }) {
    if (!value && !badge) return null;
    return (
        <div className={cn(span === 2 ? 'col-span-2' : '')}>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
            {badge ? (
                <Badge className={cn("px-3 py-1.5 text-xs font-bold uppercase",
                    color === 'orange' ? "bg-orange-100 text-orange-700 hover:bg-orange-100" :
                        color === 'purple' ? "bg-purple-100 text-purple-700 hover:bg-purple-100" :
                            "bg-cyan-100 text-cyan-700 hover:bg-cyan-100"
                )}>
                    {value || 'N/A'}
                </Badge>
            ) : (
                <p className="text-sm font-bold text-gray-900 truncate">{value || 'N/A'}</p>
            )}
        </div>
    );
}

function ContactItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/30 hover:border-cyan-200 transition-colors">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-white text-cyan-600 shadow-sm">
                {icon}
            </div>
            <div className="text-left flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">{label}</p>
                <p className="text-sm font-bold text-gray-800 truncate">{value}</p>
            </div>
        </div>
    );
}

function PipelineItem({ title, time, status, isFirst = false, isLast = false, action }: { title: string, time: string, status: 'completed' | 'current' | 'pending' | 'waiting', isFirst?: boolean, isLast?: boolean, action?: React.ReactNode }) {
    return (
        <div className="flex gap-5 group">
            <div className="flex flex-col items-center">
                <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 text-[10px]",
                    status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" :
                        status === 'current' ? "bg-cyan-500 border-cyan-500 text-white animate-pulse" :
                            "bg-white border-gray-200 text-gray-300"
                )}>
                    {status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
                        status === 'current' ? <Clock className="h-4 w-4" /> :
                            null}
                </div>
                {!isLast && (
                    <div className={cn(
                        "w-px h-full min-h-[30px] -mt-1 -mb-1",
                        status === 'completed' ? "bg-emerald-500" : "bg-gray-200"
                    )} />
                )}
            </div>
            <div className="pb-5 flex-1">
                <div className="flex items-center justify-between">
                    <p className={cn(
                        "text-xs font-bold uppercase tracking-tight",
                        status === 'waiting' ? "text-gray-400" : "text-gray-900"
                    )}>
                        {title}
                    </p>
                    {action && <div>{action}</div>}
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{time}</p>
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
