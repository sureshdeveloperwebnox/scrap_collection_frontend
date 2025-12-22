'use client';

import { Clock, ChevronDown, CheckCircle2, User, Package, X, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export function toDisplayOrderStatus(status: string): string {
    const s = status?.toUpperCase();
    const statusMap: Record<string, string> = {
        'PENDING': 'Pending',
        'ASSIGNED': 'Assigned',
        'IN_PROGRESS': 'In Progress',
        'COMPLETED': 'Completed',
        'CANCELLED': 'Cancelled',
    };
    return statusMap[s] || s || 'N/A';
}

export function toDisplayPaymentStatus(status: string): string {
    const s = status?.toUpperCase();
    const statusMap: Record<string, string> = {
        'PAID': 'Paid',
        'UNPAID': 'Unpaid',
        'REFUNDED': 'Refunded',
        'PARTIAL': 'Partial',
    };
    return statusMap[s] || s || 'N/A';
}

export function OrderStatusBadge({ status, showDropdownIcon = false }: { status: string; showDropdownIcon?: boolean }) {
    const safeStatus = status || 'PENDING';
    const display = toDisplayOrderStatus(safeStatus);
    const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap';

    let badgeContent = null;

    if (safeStatus === 'PENDING') {
        badgeContent = (
            <span className={cn(base, "bg-yellow-100 text-yellow-800")}>
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="whitespace-nowrap">Pending</span>
                {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
            </span>
        );
    } else if (safeStatus === 'ASSIGNED') {
        badgeContent = (
            <span className={cn(base, "bg-blue-100 text-blue-800")}>
                <User className="h-3 w-3 flex-shrink-0" />
                <span className="whitespace-nowrap">Assigned</span>
                {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
            </span>
        );
    } else if (safeStatus === 'IN_PROGRESS') {
        badgeContent = (
            <span className={cn(base, "bg-orange-100 text-orange-800")}>
                <Package className="h-3 w-3 flex-shrink-0" />
                <span className="whitespace-nowrap">In Progress</span>
                {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
            </span>
        );
    } else if (safeStatus === 'COMPLETED') {
        badgeContent = (
            <span className={cn(base, "bg-green-100 text-green-800")}>
                <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                <span className="whitespace-nowrap">Completed</span>
                {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
            </span>
        );
    } else if (safeStatus === 'CANCELLED') {
        badgeContent = (
            <span className={cn(base, "bg-red-100 text-red-800")}>
                <X className="h-3 w-3 flex-shrink-0" />
                <span className="whitespace-nowrap">Cancelled</span>
                {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
            </span>
        );
    } else {
        badgeContent = (
            <span className={cn(base, "bg-gray-100 text-gray-800")}>
                <span className="whitespace-nowrap">{display}</span>
                {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
            </span>
        );
    }

    return badgeContent;
}

export function PaymentStatusBadge({ status }: { status: string }) {
    const safeStatus = status || 'UNPAID';
    const display = toDisplayPaymentStatus(safeStatus);
    const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap';

    if (safeStatus === 'PAID') {
        return (
            <span className={cn(base, "bg-green-100 text-green-800")}>
                <DollarSign className="h-3 w-3 flex-shrink-0" />
                <span className="whitespace-nowrap">Paid</span>
            </span>
        );
    } else if (safeStatus === 'UNPAID') {
        return (
            <span className={cn(base, "bg-yellow-100 text-yellow-800")}>
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="whitespace-nowrap">Unpaid</span>
            </span>
        );
    } else if (safeStatus === 'REFUNDED') {
        return (
            <span className={cn(base, "bg-red-100 text-red-800")}>
                <X className="h-3 w-3 flex-shrink-0" />
                <span className="whitespace-nowrap">Refunded</span>
            </span>
        );
    }

    return (
        <span className={cn(base, "bg-gray-100 text-gray-800")}>
            <span className="whitespace-nowrap">{display}</span>
        </span>
    );
}
