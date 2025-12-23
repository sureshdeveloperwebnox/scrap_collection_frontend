// Minimalistic Personnel Profile Dialog - No Gradients, Clean Design
// Uses global design system with flat colors only

function CollectorInfoDialog({
    order,
    isOpen,
    onClose
}: {
    order: ApiOrder | null;
    isOpen: boolean;
    onClose: () => void;
}) {
    const router = useRouter();
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    if (!order) return null;

    const isCrew = !!order.crewId;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) return;
        }}>
            <DialogContent
                className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col p-0"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                hideClose={true}
            >
                {/* Minimalistic Header - Solid Color, No Gradient */}
                <div className="bg-primary px-8 py-8">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-5">
                            {/* Simple Avatar - White with Icon */}
                            <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center">
                                {isCrew ? (
                                    <Users className="h-8 w-8 text-primary" />
                                ) : (
                                    <User className="h-8 w-8 text-primary" />
                                )}
                            </div>

                            {/* Title */}
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">
                                    {isCrew ? order.crew?.name : order.assignedCollector?.fullName || 'Personnel Details'}
                                </h2>
                                <p className="text-white/80 text-sm">
                                    {isCrew ? 'Crew Assignment' : 'Individual Collector'} • Order #{order.orderNumber || order.id}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <OrderStatusBadge status={order.orderStatus} />
                            <PaymentStatusBadge status={order.paymentStatus} />
                        </div>
                    </div>

                    {/* Simple Stats - No Cards, Just Text */}
                    <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-white/20">
                        <div>
                            <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Pickup Date</p>
                            <p className="text-sm font-semibold text-white">
                                {order.pickupTime ? new Date(order.pickupTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Not scheduled'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Distance</p>
                            <p className="text-sm font-semibold text-white">{order.routeDistance || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Duration</p>
                            <p className="text-sm font-semibold text-white">{order.routeDuration || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Content Area - Clean White Background */}
                <div className="flex-1 overflow-y-auto px-8 py-6 bg-white">
                    {/* Crew Members */}
                    {isCrew && order.crew?.members && order.crew.members.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                Crew Members ({order.crew.members.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {order.crew.members.map((member: any) => (
                                    <div
                                        key={member.id}
                                        className="group flex items-center gap-3 p-4 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-all cursor-pointer"
                                        onClick={() => {
                                            onClose();
                                            router.push(`/employees?view=${member.id}&returnTo=/orders`);
                                        }}
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold text-lg">
                                                {member.fullName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                                                {member.fullName}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                        </div>
                                        <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Individual Collector */}
                    {!isCrew && order.assignedCollector && (
                        <div className="mb-6">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                Collector Information
                            </h3>
                            <div
                                className="group flex items-center gap-4 p-5 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-all cursor-pointer"
                                onClick={() => {
                                    onClose();
                                    router.push(`/employees?view=${order.assignedCollectorId}&returnTo=/orders`);
                                }}
                            >
                                <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-bold text-2xl">
                                        {order.assignedCollector.fullName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                                        {order.assignedCollector.fullName}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">{order.assignedCollector.email}</p>
                                </div>
                                <Eye className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                            </div>
                        </div>
                    )}

                    {/* Order Details - Minimalistic Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Vehicle Details */}
                        <div className="p-5 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-4">
                                <Package className="h-4 w-4 text-primary" />
                                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                                    Vehicle Details
                                </h3>
                            </div>
                            <div className="space-y-2">
                                {order.vehicleDetails?.make && (
                                    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                        <span className="text-xs text-muted-foreground uppercase">Make</span>
                                        <span className="text-sm font-semibold text-foreground">{order.vehicleDetails.make}</span>
                                    </div>
                                )}
                                {order.vehicleDetails?.model && (
                                    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                        <span className="text-xs text-muted-foreground uppercase">Model</span>
                                        <span className="text-sm font-semibold text-foreground">{order.vehicleDetails.model}</span>
                                    </div>
                                )}
                                {order.vehicleDetails?.year && (
                                    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                        <span className="text-xs text-muted-foreground uppercase">Year</span>
                                        <span className="text-sm font-semibold text-foreground">{order.vehicleDetails.year}</span>
                                    </div>
                                )}
                                {order.vehicleDetails?.condition && (
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-xs text-muted-foreground uppercase">Condition</span>
                                        <span className="text-sm font-semibold text-foreground capitalize">
                                            {order.vehicleDetails.condition.toLowerCase().replace('_', ' ')}
                                        </span>
                                    </div>
                                )}
                                {!order.vehicleDetails?.make && !order.vehicleDetails?.model && (
                                    <p className="text-sm text-muted-foreground italic">No vehicle details available</p>
                                )}
                            </div>
                        </div>

                        {/* Scrap Yard */}
                        {order.yardId && (
                            <div className="p-5 rounded-lg border border-border">
                                <div className="flex items-center gap-2 mb-4">
                                    <MapPin className="h-4 w-4 text-green-600" />
                                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                                        Scrap Yard
                                    </h3>
                                </div>
                                <p className="text-sm font-semibold text-foreground mb-1">
                                    {order.yard?.yardName || order.yardId}
                                </p>
                                {order.yard?.address && (
                                    <p className="text-xs text-muted-foreground">{order.yard.address}</p>
                                )}
                            </div>
                        )}

                        {/* Collection Address */}
                        <div className="p-5 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="h-4 w-4 text-amber-600" />
                                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                                    Collection Address
                                </h3>
                            </div>
                            <p className="text-sm font-semibold text-foreground leading-relaxed">{order.address}</p>
                        </div>

                        {/* Customer Info */}
                        <div className="p-5 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="h-4 w-4 text-purple-600" />
                                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                                    Customer
                                </h3>
                            </div>
                            <p className="text-sm font-semibold text-foreground mb-1">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                        </div>
                    </div>
                </div>

                {/* Simple Footer */}
                <div className="flex justify-between items-center px-8 py-4 border-t border-border bg-white">
                    <p className="text-xs text-muted-foreground">
                        Click on any personnel card to view their profile
                    </p>
                    <Button
                        onClick={onClose}
                        className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
