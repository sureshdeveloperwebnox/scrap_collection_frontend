// Minimalistic Employee Profile Dialog - No Gradients, Clean Design
// Uses global design system with flat colors only

import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, UserCheck, UserX, Phone, Mail, Shield, MapPin, Calendar } from 'lucide-react';
import { Employee } from '@/types';
import { cn } from '@/lib/utils';


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
                {/* Minimalistic Header - Solid Color, No Gradient */}
                <div className="bg-primary px-8 py-8">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-5">
                            {/* Simple Avatar with Status Badge */}
                            <div className="relative">
                                <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center">
                                    <span className="text-primary font-bold text-2xl">
                                        {employee.fullName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className={cn(
                                    "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-primary",
                                    employee.isActive ? "bg-green-600" : "bg-gray-500"
                                )}>
                                    {employee.isActive ? (
                                        <UserCheck className="h-3 w-3 text-white" />
                                    ) : (
                                        <UserX className="h-3 w-3 text-white" />
                                    )}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">
                                    {employee.fullName}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-white/80">
                                        {(employee as any).role?.name || employee.role || 'Employee'}
                                    </span>
                                    <span className="text-white/60">•</span>
                                    <span className={cn(
                                        "text-xs font-semibold",
                                        employee.isActive ? "text-green-300" : "text-gray-300"
                                    )}>
                                        {employee.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Simple Stats - No Cards, Just Text */}
                    <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-white/20">
                        <div>
                            <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Phone</p>
                            <p className="text-sm font-semibold text-white">{employee.phone || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Email</p>
                            <p className="text-sm font-semibold text-white truncate">{employee.email}</p>
                        </div>
                        <div>
                            <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Joined</p>
                            <p className="text-sm font-semibold text-white">
                                {new Date(employee.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content Area - Clean White Background */}
                <div className="flex-1 overflow-y-auto px-8 py-6 bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Contact Information */}
                        <div className="p-5 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="h-4 w-4 text-primary" />
                                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                                    Contact Information
                                </h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-foreground">{employee.phone || 'Not provided'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-foreground">{employee.email}</span>
                                </div>
                            </div>
                        </div>

                        {/* Role & Permissions */}
                        <div className="p-5 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-4">
                                <Shield className="h-4 w-4 text-purple-600" />
                                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                                    Role & Permissions
                                </h3>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                                {(employee as any).role?.name || employee.role || 'No role assigned'}
                            </p>
                        </div>

                        {/* Work Zone */}
                        <div className="p-5 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="h-4 w-4 text-green-600" />
                                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                                    Work Zone
                                </h3>
                            </div>
                            <p className="text-sm font-semibold text-foreground">
                                {(employee as any).scrapYard?.yardName || (employee as any).scrapYard?.name || employee.workZone || 'Not assigned'}
                            </p>
                        </div>

                        {/* Employment Details */}
                        <div className="p-5 rounded-lg border border-border">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="h-4 w-4 text-amber-600" />
                                <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                                    Employment Details
                                </h3>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center py-2 border-b border-border">
                                    <span className="text-xs text-muted-foreground uppercase">Joined Date</span>
                                    <span className="text-sm font-semibold text-foreground">
                                        {new Date(employee.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-xs text-muted-foreground uppercase">Employee ID</span>
                                    <span className="text-sm font-semibold text-foreground font-mono">{employee.id.slice(0, 8)}...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Simple Footer */}
                <div className="flex justify-between items-center px-8 py-4 border-t border-border bg-white">
                    <p className="text-xs text-muted-foreground">
                        Employee profile information
                    </p>
                    <Button
                        onClick={handleClose}
                        className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
                    >
                        {returnTo ? 'Back to Orders' : 'Close'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default EmployeeProfileDialog;
