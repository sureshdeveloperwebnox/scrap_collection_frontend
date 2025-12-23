// Employee Profile View Dialog Component - Using Global Design System
// This component uses CSS variables and Tailwind design tokens from your global styles
// Primary color: cyan-500 (rgb(45, 186, 237)) - Your brand color

function EmployeeProfileDialog({
    employee,
    isOpen,
    onClose,
    returnTo
}: {
    employee: Employee | null;
    isOpen: boolean;
    onClose: () => void;
    returnTo?: string;
}) {
    const router = useRouter();

    if (!employee) return null;

    const handleClose = () => {
        onClose();
        if (returnTo) {
            router.push(returnTo);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) handleClose();
        }}>
            <DialogContent
                className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col p-0"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                {/* Header Section - Using Global Primary Color */}
                <div className="relative bg-gradient-to-r from-primary to-cyan-700 px-8 py-10">
                    {/* Subtle grid pattern background */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>

                    <div className="relative z-10">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-5">
                                {/* Avatar - White background with primary colored initial */}
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-2xl bg-card backdrop-blur-sm flex items-center justify-center shadow-xl">
                                        <span className="text-primary font-bold text-4xl tracking-tight">
                                            {employee.fullName.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    {/* Status Badge on Avatar */}
                                    <div className={cn(
                                        "absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-4 border-card",
                                        employee.isActive ? "bg-green-600" : "bg-gray-500"
                                    )}>
                                        {employee.isActive ? (
                                            <UserCheck className="h-4 w-4 text-white" />
                                        ) : (
                                            <UserX className="h-4 w-4 text-white" />
                                        )}
                                    </div>
                                </div>

                                {/* Name and Role */}
                                <div>
                                    <h2 className="text-3xl font-bold text-primary-foreground mb-1.5 tracking-tight">
                                        {employee.fullName}
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                            <Shield className="h-3.5 w-3.5 text-primary-foreground" />
                                            <span className="text-sm font-semibold text-primary-foreground">
                                                {(employee as any).role?.name || employee.role || 'Employee'}
                                            </span>
                                        </div>
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                                            employee.isActive ? "bg-green-600 text-white" : "bg-gray-500 text-white"
                                        )}>
                                            {employee.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Bar */}
                        <div className="grid grid-cols-3 gap-4 mt-8">
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                        <Phone className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wide">Phone</p>
                                        <p className="text-sm font-bold text-primary-foreground truncate">{employee.phone || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                        <Mail className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wide">Email</p>
                                        <p className="text-sm font-bold text-primary-foreground truncate">{employee.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-primary-foreground" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wide">Joined</p>
                                        <p className="text-sm font-bold text-primary-foreground">
                                            {new Date(employee.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area - Using muted background */}
                <div className="flex-1 overflow-y-auto px-8 py-6 bg-muted">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Contact Information */}
                        <div className="rounded-xl bg-card border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <User className="h-6 w-6 text-primary-foreground" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
                                        Contact Information
                                    </h3>
                                    <div className="space-y-2.5">
                                        <div className="flex items-center gap-2.5">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-foreground font-medium">{employee.phone || 'Not provided'}</span>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-foreground font-medium">{employee.email}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Role & Permissions */}
                        <div className="rounded-xl bg-card border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <Shield className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3">
                                        Role & Permissions
                                    </h3>
                                    <div className="bg-muted rounded-lg px-4 py-3 border border-border">
                                        <span className="text-sm font-bold text-card-foreground">
                                            {(employee as any).role?.name || employee.role || 'No role assigned'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Work Zone */}
                        <div className="rounded-xl bg-card border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <MapPin className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider mb-3">
                                        Work Zone
                                    </h3>
                                    <div className="bg-muted rounded-lg px-4 py-3 border border-border">
                                        <span className="text-sm font-bold text-card-foreground">
                                            {(employee as any).scrapYard?.yardName || (employee as any).scrapYard?.name || employee.workZone || 'Not assigned'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Employment Details */}
                        <div className="rounded-xl bg-card border border-border p-6 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-amber-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                    <Calendar className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">
                                        Employment Details
                                    </h3>
                                    <div className="space-y-2">
                                        <div className="bg-muted rounded-lg px-3 py-2.5 border border-border">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Joined Date</span>
                                            <span className="text-sm font-bold text-card-foreground">
                                                {new Date(employee.createdAt).toLocaleDateString('en-US', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="bg-muted rounded-lg px-3 py-2.5 border border-border">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Employee ID</span>
                                            <span className="text-sm font-bold text-card-foreground font-mono">{employee.id.slice(0, 8)}...</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions - Using global design tokens */}
                <div className="flex justify-between items-center gap-3 px-8 py-5 border-t border-border bg-card">
                    <p className="text-xs text-muted-foreground font-medium">
                        Employee profile information
                    </p>
                    <Button
                        onClick={handleClose}
                        className="bg-gradient-to-r from-primary to-cyan-700 hover:from-cyan-600 hover:to-cyan-800 text-primary-foreground font-semibold px-8 py-2.5 shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
                    >
                        {returnTo ? 'Back to Orders' : 'Close'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
