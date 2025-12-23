// Enhanced Personnel Profile Dialog Component - Using Global Design System
// This component uses CSS variables and Tailwind design tokens from your global styles
// Primary color: cyan-500 (rgb(45, 186, 237)) - Your brand color

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

    // Determine if this is a crew assignment or individual collector
    const isCrew = !!order.crewId;
    const personnelData = isCrew ? order.crew : order.assignedCollector;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) return;
        }}>
            <DialogContent
                className="sm:max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col p-0"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                hideClose={true}
            >
                {/* Header Section - Using Global Primary Color */}
                <div className="relative bg-gradient-to-r from-primary to-cyan-700 px-8 py-10">
                    {/* Subtle grid pattern background */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>

                    <div className="relative z-10">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-5">
                                {/* Avatar - White background with primary colored icon */}
                                <div className="w-20 h-20 rounded-2xl bg-card backdrop-blur-sm flex items-center justify-center shadow-xl">
                                    {isCrew ? (
                                        <Users className="h-10 w-10 text-primary" />
                                    ) : (
                                        <User className="h-10 w-10 text-primary" />
                                    )}
                                </div>

                                {/* Name and Role */}
                                <div>
                                    <h2 className="text-3xl font-bold text-primary-foreground mb-1.5 tracking-tight">
                                        {isCrew ? order.crew?.name : order.assignedCollector?.fullName || 'Personnel Details'}
                                    </h2>
                                    <p className="text-primary-foreground/90 text-sm font-semibold">
                                        {isCrew ? 'Crew Assignment' : 'Individual Collector'} • Order #{order.orderNumber || order.id}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <OrderStatusBadge status={order.orderStatus} />
                                <PaymentStatusBadge status={order.paymentStatus} />
                            </div>
                        </div>

                        {/* Quick Stats Bar */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wide">Pickup Date</p>
                                        <p className="text-sm font-bold text-primary-foreground truncate">
                                            {order.pickupTime ? new Date(order.pickupTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Not scheduled'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                        <MapIcon className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wide">Distance</p>
                                        <p className="text-sm font-bold text-primary-foreground truncate">{order.routeDistance || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wide">Duration</p>
                                        <p className="text-sm font-bold text-primary-foreground truncate">{order.routeDuration || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area - Using muted background */}
                <div className="flex-1 overflow-y-auto px-8 py-6 bg-muted">
                    {/* Crew Members Section - Only for Crew Assignments */}
                    {isCrew && order.crew?.members && order.crew.members.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-card-foreground mb-4 flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Crew Members ({order.crew.members.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {order.crew.members.map((member: any) => (
                                    <div
                                        key={member.id}
                                        className="group relative overflow-hidden rounded-xl bg-card border border-border p-4 hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
                                        onClick={() => {
                                            onClose();
                                            router.push(`/employees?view=${member.id}&returnTo=/orders`);
                                        }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-cyan-700 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                                <span className="text-primary-foreground font-bold text-lg">
                                                    {member.fullName.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-card-foreground text-base truncate group-hover:text-primary transition-colors">
                                                    {member.fullName}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                                </div>
                                            </div>
                                            <Eye className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Individual Collector Details - Only for Single Collector */}
                    {!isCrew && order.assignedCollector && (
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-card-foreground mb-4 flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Collector Information
                            </h3>
                            <div
                                className="group relative overflow-hidden rounded-xl bg-card border border-border p-6 hover:border-primary hover:shadow-xl transition-all duration-300 cursor-pointer"
                                onClick={() => {
                                    onClose();
                                    router.push(`/employees?view=${order.assignedCollectorId}&returnTo=/orders`);
                                }}
                            >
                                <div className="flex items-start gap-6">
                                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-cyan-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <span className="text-primary-foreground font-bold text-2xl">
                                            {order.assignedCollector.fullName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="text-2xl font-bold text-card-foreground group-hover:text-primary transition-colors">
                                                {order.assignedCollector.fullName}
                                            </h4>
                                            <Eye className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-primary" />
                                                <span className="text-sm text-foreground font-medium">{order.assignedCollector.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-primary" />
                                                <span className="text-sm text-foreground font-medium">ID: {order.assignedCollectorId}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Order Details Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Vehicle Details */}
                        <div className="rounded-xl bg-card border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <Package className="h-6 w-6 text-primary-foreground" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
                                        Vehicle Details
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {order.vehicleDetails?.make && (
                                            <div className="bg-muted rounded-lg px-3 py-2.5 border border-border">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Make</span>
                                                <span className="text-sm font-bold text-card-foreground">{order.vehicleDetails.make}</span>
                                            </div>
                                        )}
                                        {order.vehicleDetails?.model && (
                                            <div className="bg-muted rounded-lg px-3 py-2.5 border border-border">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Model</span>
                                                <span className="text-sm font-bold text-card-foreground">{order.vehicleDetails.model}</span>
                                            </div>
                                        )}
                                        {order.vehicleDetails?.year && (
                                            <div className="bg-muted rounded-lg px-3 py-2.5 border border-border">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Year</span>
                                                <span className="text-sm font-bold text-card-foreground">{order.vehicleDetails.year}</span>
                                            </div>
                                        )}
                                        {order.vehicleDetails?.condition && (
                                            <div className="bg-muted rounded-lg px-3 py-2.5 border border-border">
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Condition</span>
                                                <span className="text-sm font-bold text-card-foreground capitalize">
                                                    {order.vehicleDetails.condition.toLowerCase().replace('_', ' ')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {!order.vehicleDetails?.make && !order.vehicleDetails?.model && (
                                        <p className="text-sm text-muted-foreground italic">No vehicle details available</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Scrap Yard */}
                        {order.yardId && (
                            <div className="rounded-xl bg-card border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <MapPin className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-3">
                                            Scrap Yard
                                        </h3>
                                        <div className="bg-muted rounded-lg px-4 py-3 border border-border">
                                            <span className="text-sm font-bold text-card-foreground">
                                                {order.yard?.yardName || order.yardId}
                                            </span>
                                        </div>
                                        {order.yard?.address && (
                                            <p className="text-sm text-muted-foreground mt-2">{order.yard.address}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Collection Address */}
                        <div className="rounded-xl bg-card border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <MapPin className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">
                                        Collection Address
                                    </h3>
                                    <p className="text-base font-bold text-card-foreground leading-relaxed">{order.address}</p>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="rounded-xl bg-card border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <User className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3">
                                        Customer
                                    </h3>
                                    <p className="text-base font-bold text-card-foreground">{order.customerName}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{order.customerPhone}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions - Using global design tokens */}
                <div className="flex justify-between items-center gap-3 px-8 py-5 border-t border-border bg-card">
                    <p className="text-xs text-muted-foreground font-medium">
                        Click on any personnel card to view their complete profile
                    </p>
                    <Button
                        onClick={onClose}
                        className="bg-gradient-to-r from-primary to-cyan-700 hover:from-cyan-600 hover:to-cyan-800 text-primary-foreground font-semibold px-8 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
