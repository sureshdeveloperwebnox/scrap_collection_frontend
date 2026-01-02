'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Plus,
    FileText,
    DollarSign,
    Calendar,
    User,
    Loader2,
    Download,
    Eye,
    Trash2,
    MoreHorizontal,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    AlertCircle,
    Pencil,
    X,
    XCircle,
    ShoppingCart,
    Activity,
    Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { InvoiceForm } from '@/components/invoice-form';
import { InvoiceDetail } from '@/components/invoice-detail-modal';
import { toast } from 'sonner';
import { useInvoices, useCreateInvoice, useInvoiceStats, useCancelInvoice, useUpdateInvoiceStatus, useUpdateInvoice } from '@/hooks/use-invoices';
import { useCustomers } from '@/hooks/use-customers';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { invoicesApi } from '@/lib/api/invoices';
import dynamic from 'next/dynamic';
import { TableSkeleton } from '@/components/ui/table-skeleton';

// Dynamically import Lottie for better performance
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// No Data Animation Component
function NoDataAnimation() {
    const [animationData, setAnimationData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/animation/nodatafoundanimation.json')
            .then((response) => {
                if (!response.ok) throw new Error('Failed to load animation');
                return response.json();
            })
            .then((data) => {
                setAnimationData(data);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error('Failed to load animation:', error);
                setIsLoading(false);
            });
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <div className="mt-2 text-gray-400 text-sm">Loading...</div>
            </div>
        );
    }

    if (!animationData) {
        return (
            <div className="flex flex-col items-center justify-center py-8">
                <div className="text-gray-400 text-sm">No invoices found</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-8">
            <div className="w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
                <Lottie
                    animationData={animationData}
                    loop={true}
                    autoplay={true}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
            <p className="mt-4 text-gray-600 text-sm font-medium">No invoices found</p>
            <p className="mt-1 text-gray-400 text-xs">Try adjusting your filters or create a new invoice</p>
        </div>
    );
}

// Sidebar navigation items for invoice module
const INVOICE_STATUS_FILTERS = [
    { id: 'all', label: 'All Invoices', icon: FileText, status: undefined, color: 'cyan', tabKey: 'All' },
    { id: 'draft', label: 'Drafts', icon: FileText, status: 'DRAFT', color: 'gray', tabKey: 'Draft' },
    { id: 'sent', label: 'Sent', icon: Clock, status: 'SENT', color: 'yellow', tabKey: 'Sent' },
    { id: 'paid', label: 'Paid', icon: CheckCircle2, status: 'PAID', color: 'green', tabKey: 'Paid' },
    { id: 'overdue', label: 'Overdue', icon: AlertCircle, status: 'OVERDUE', color: 'red', tabKey: 'Overdue' },
    { id: 'cancelled', label: 'Cancelled', icon: XCircle, status: 'CANCELLED', color: 'gray', tabKey: 'Cancelled' },
] as const;

type TabKey = 'All' | 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';

function getTabStyle(tab: TabKey) {
    switch (tab) {
        case 'All':
            return { activeText: 'text-cyan-700', activeBg: 'bg-cyan-50', underline: 'bg-cyan-500', count: 'bg-cyan-100 text-cyan-700' };
        case 'Draft':
            return { activeText: 'text-gray-700', activeBg: 'bg-gray-50', underline: 'bg-gray-600', count: 'bg-gray-200 text-gray-700' };
        case 'Sent':
            return { activeText: 'text-yellow-700', activeBg: 'bg-yellow-50', underline: 'bg-yellow-600', count: 'bg-yellow-100 text-yellow-700' };
        case 'Paid':
            return { activeText: 'text-emerald-700', activeBg: 'bg-emerald-50', underline: 'bg-emerald-600', count: 'bg-emerald-100 text-emerald-700' };
        case 'Overdue':
            return { activeText: 'text-rose-700', activeBg: 'bg-rose-50', underline: 'bg-rose-600', count: 'bg-rose-100 text-rose-700' };
        case 'Cancelled':
            return { activeText: 'text-slate-700', activeBg: 'bg-slate-50', underline: 'bg-slate-600', count: 'bg-slate-200 text-slate-700' };
        default:
            return { activeText: 'text-primary', activeBg: 'bg-muted', underline: 'bg-primary', count: 'bg-muted text-foreground' };
    }
}

// Premium Stat Card Component
function StatCard({ title, value, color, icon: Icon, delay = 0 }: { title: string, value: number | string, color: string, icon: any, delay?: number }) {
    const cardVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring" as const,
                stiffness: 100,
                damping: 15,
                delay
            }
        }
    };

    const getGradient = (c: string) => {
        switch (c) {
            case 'cyan': return 'from-cyan-500 to-blue-600 shadow-cyan-200/50';
            case 'yellow': return 'from-amber-400 to-orange-500 shadow-orange-200/50';
            case 'blue': return 'from-blue-500 to-indigo-600 shadow-blue-200/50';
            case 'orange': return 'from-orange-400 to-red-500 shadow-red-200/50';
            case 'green': return 'from-emerald-400 to-green-600 shadow-green-200/50';
            case 'red': return 'from-rose-500 to-red-600 shadow-red-200/50';
            default: return 'from-slate-400 to-slate-500 shadow-slate-200/50';
        }
    };

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -8, scale: 1.02 }}
            className={cn(
                "relative overflow-hidden group h-[130px] rounded-[32px] p-0.5 transition-all duration-500 shadow-xl",
                getGradient(color)
            )}
        >
            <div className={cn("absolute inset-0 bg-gradient-to-br", getGradient(color).split(' ').slice(0, 2).join(' '))} />
            <div className="absolute top-[1px] left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent z-30" />
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] m-1 rounded-[30px] border border-white/20 z-10" />

            <div className="relative z-30 flex flex-col justify-between h-full p-5 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-[10px] font-bold text-white/80 uppercase tracking-[2px] mb-1">{title}</p>
                        <div className="text-2xl font-black tracking-tight drop-shadow-lg">
                            {value}
                        </div>
                    </div>
                    <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg group-hover:rotate-12 group-hover:scale-110 transition-all duration-500">
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>

                <div className="flex justify-end">
                    <motion.div
                        animate={{
                            opacity: [0.3, 0.8, 0.3],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="w-1.5 h-1.5 rounded-full bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    />
                </div>
            </div>
        </motion.div>
    );
}

export default function InvoicesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<string>('all');
    const [isCreating, setIsCreating] = useState(false);
    const [prefillWorkOrderId, setPrefillWorkOrderId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [editingInvoice, setEditingInvoice] = useState<any>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [invoiceToCancel, setInvoiceToCancel] = useState<any>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const activeItem = INVOICE_STATUS_FILTERS.find(item => item.id === activeSection);
    const activeTab = (activeItem?.tabKey || 'All') as TabKey;

    // Fetch invoices based on active status
    const { data: invoicesData, isLoading: isLoadingInvoices, refetch: refetchInvoices } = useInvoices({
        status: activeItem?.status,
        search: debouncedSearch || undefined,
        startDate: dateFrom || undefined,
        endDate: dateTo || undefined,
        customerId: (selectedCustomerId && selectedCustomerId !== 'all-customers') ? selectedCustomerId : undefined,
        limit: 50
    });
    const invoices = invoicesData?.data?.invoices || [];

    // Fetch stats
    const { data: statsData, refetch: refetchStats } = useInvoiceStats();
    const stats = statsData?.data || {
        total: 0,
        draft: 0,
        sent: 0,
        paid: 0,
        overdue: 0,
        cancelled: 0,
        totalRevenue: 0,
        pendingRevenue: 0
    };
    
    // Fetch customers for filter
    const { data: customersData } = useCustomers({ limit: 100 });
    const customers = customersData?.data?.customers || [];

    // Mutations
    const createInvoiceMutation = useCreateInvoice();
    const cancelInvoiceMutation = useCancelInvoice();
    const updateStatusMutation = useUpdateInvoiceStatus();
    const updateInvoiceMutation = useUpdateInvoice();

    const handleStatusChange = async (id: string, newStatus: string) => {
        const toastId = toast.loading('Updating status...');
        try {
            await updateStatusMutation.mutateAsync({ id, status: newStatus });
            toast.success(`Status updated to ${newStatus}`, { id: toastId });
            refetchStats();
        } catch (error) {
            toast.error('Failed to update status', { id: toastId });
        }
    };

    const handleUpdateInvoice = async (data: any) => {
        if (!editingInvoice?.id) return;

        const toastId = toast.loading('Updating invoice...');
        try {
            await updateInvoiceMutation.mutateAsync({
                id: editingInvoice.id,
                data
            });
            setIsCreating(false);
            setEditingInvoice(null);
            refetchInvoices();
            refetchStats();
            toast.success('Invoice updated successfully', { id: toastId });
        } catch (error) {
            toast.error('Failed to update invoice', { id: toastId });
        }
    };

    // Check if we're coming from a work order with prefill data
    useEffect(() => {
        const workOrderId = searchParams.get('workOrderId');
        const action = searchParams.get('action');

        if (workOrderId && action === 'create') {
            setPrefillWorkOrderId(workOrderId);
            setIsCreating(true);
        }
    }, [searchParams]);

    const handleCreateInvoice = async (data: any) => {
        try {
            await createInvoiceMutation.mutateAsync(data);
            toast.success('Invoice created successfully!');
            setIsCreating(false);
            setPrefillWorkOrderId(null);
            router.replace('/invoices');
            refetchInvoices();
            refetchStats();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create invoice');
        }
    };

    const handleCancelClick = (invoice: any) => {
        setInvoiceToCancel(invoice);
        setCancelReason('');
    };

    const confirmCancellation = async () => {
        if (!cancelReason.trim()) {
            toast.error('Please provide a cancellation reason');
            return;
        }
        
        const toastId = toast.loading('Cancelling invoice...');
        try {
            await cancelInvoiceMutation.mutateAsync({ 
                id: invoiceToCancel.id, 
                reason: cancelReason 
            });
            toast.success('Invoice cancelled successfully', { id: toastId });
            setInvoiceToCancel(null);
            refetchInvoices();
            refetchStats();
        } catch (error) {
            toast.error('Failed to cancel invoice', { id: toastId });
        }
    };


    const handleDownload = async (id: string, number: string) => {
        try {
            const toastId = toast.loading('Generating invoice PDF...');
            const result = await invoicesApi.downloadInvoice(id);

            if (result?.data?.html) {
                const win = window.open('', '_blank');
                if (win) {
                    win.document.write(result.data.html);
                    win.document.close();

                    // Add a small delay for styling to load before printing
                    setTimeout(() => {
                        win.print();
                        toast.success('Invoice ready to print!', { id: toastId });
                    }, 500);
                } else {
                    toast.error('Pop-up blocked. Please allow pop-ups.', { id: toastId });
                }
            } else {
                toast.error('Failed to generate PDF', { id: toastId });
            }
        } catch (error) {
            toast.error('Error downloading invoice');
        }
    };

    const getTabCount = (tab: TabKey): number => {
        switch (tab) {
            case 'All': return stats.total || 0;
            case 'Draft': return stats.draft || 0;
            case 'Sent': return stats.sent || 0;
            case 'Paid': return stats.paid || 0;
            case 'Overdue': return stats.overdue || 0;
            case 'Cancelled': return stats.cancelled || 0;
            default: return 0;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Invoices</h1>
                    <p className="text-gray-500 mt-1">Manage billing and payments</p>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {isCreating ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-200 rounded-[40px] w-full relative overflow-hidden ring-1 ring-slate-100"
                    >
                        <InvoiceForm
                            prefillWorkOrderId={prefillWorkOrderId}
                            initialData={editingInvoice}
                            onSubmit={editingInvoice ? handleUpdateInvoice : handleCreateInvoice}
                            onCancel={() => {
                                setIsCreating(false);
                                setPrefillWorkOrderId(null);
                                setEditingInvoice(null);
                                router.replace('/invoices');
                            }}
                        />
                    </motion.div>
                ) : (
                    <>
                        {/* Stats Overview */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <StatCard title="Total" value={stats.total} color="cyan" icon={FileText} delay={0} />
                            <StatCard title="Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} color="green" icon={DollarSign} delay={0.1} />
                            <StatCard title="Pending" value={`$${stats.pendingRevenue.toLocaleString()}`} color="yellow" icon={Clock} delay={0.2} />
                            <StatCard title="Overdue" value={stats.overdue} color="red" icon={AlertCircle} delay={0.3} />
                            <StatCard title="Paid" value={stats.paid} color="blue" icon={CheckCircle2} delay={0.4} />
                            <StatCard title="Cancelled" value={stats.cancelled || 0} color="gray" icon={XCircle} delay={0.5} />
                        </div>

                        {/* Main Table Area */}
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 rounded-[32px] overflow-hidden"
                        >
                            <div className="p-6 pb-0">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-cyan-600" />
                                        </div>
                                        <h2 className="text-xl font-bold text-gray-900">Recent Invoices</h2>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                                            className="border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-gray-900 active:bg-gray-200 transition-all h-9 w-9 p-0"
                                        >
                                            <Search className="h-4 w-4" />
                                        </Button>

                                        {isSearchOpen && (
                                            <div className="relative">
                                                <Input
                                                    type="text"
                                                    placeholder="Search..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onBlur={() => { if (!searchQuery) setIsSearchOpen(false); }}
                                                    autoFocus
                                                    className="w-64 pl-10 pr-10 rounded-lg border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
                                                />
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                                {searchQuery && (
                                                    <button onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                         <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                                            className={cn(
                                                "h-9 w-9 p-0 transition-all",
                                                (dateFrom || dateTo || selectedCustomerId)
                                                    ? "bg-cyan-50 border-cyan-500 text-cyan-700 hover:bg-cyan-100"
                                                    : "hover:bg-gray-100 hover:text-cyan-600"
                                            )}
                                            title={isFilterOpen ? "Hide filters" : "Show filters"}
                                        >
                                            <Filter className={cn("h-4 w-4", (dateFrom || dateTo || selectedCustomerId) && "text-cyan-700")} />
                                        </Button>

                                        <Button onClick={() => setIsCreating(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white h-9 w-9 p-0" title="Add Invoice">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                     </div>
                                </div>

                                {/* Server-Side Filters */}
                                <AnimatePresence>
                                    {isFilterOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-wrap items-center gap-6">
                                                <div className="flex items-center gap-3">
                                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Date Range</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="date"
                                                            value={dateFrom}
                                                            onChange={(e) => setDateFrom(e.target.value)}
                                                            className="h-9 w-[150px] rounded-xl border-slate-200 bg-white text-xs font-bold focus:ring-cyan-500"
                                                        />
                                                        <span className="text-slate-300 text-[10px] font-black uppercase">to</span>
                                                        <Input
                                                            type="date"
                                                            value={dateTo}
                                                            onChange={(e) => setDateTo(e.target.value)}
                                                            className="h-9 w-[150px] rounded-xl border-slate-200 bg-white text-xs font-bold focus:ring-cyan-500"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Customer</Label>
                                                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                                        <SelectTrigger className="h-9 w-[200px] rounded-xl border-slate-200 bg-white text-xs font-bold focus:ring-cyan-500 shadow-sm">
                                                            <SelectValue placeholder="All Customers" />
                                                        </SelectTrigger>
                                                        <SelectContent className="rounded-xl border-none shadow-2xl">
                                                            <SelectItem value="all-customers" className="text-xs font-bold">All Customers</SelectItem>
                                                            {customers.map((c: any) => (
                                                                <SelectItem key={c.id} value={c.id} className="text-xs font-bold">
                                                                    {c.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {(dateFrom || dateTo || selectedCustomerId) && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setDateFrom('');
                                                            setDateTo('');
                                                            setSelectedCustomerId('');
                                                        }}
                                                        className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50"
                                                    >
                                                        <X className="h-3 w-3 mr-2" /> Reset Filters
                                                    </Button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="p-0">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        key={activeTab}
                                        className="p-0"
                                    >
                                        {isLoadingInvoices ? (
                                            <div className="p-6">
                                                <TableSkeleton columnCount={7} rowCount={10} />
                                            </div>
                                        ) : (
                                            <>
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader className="bg-white">
                                                            <TableRow className="hover:bg-transparent border-b-2 border-gray-200 bg-gray-50/50">
                                                                <TableHead colSpan={7} className="p-0 bg-transparent h-auto">
                                                                    <div className="w-full overflow-x-auto">
                                                                        <div className="inline-flex items-center gap-1 px-6 py-3">
                                                                            {(['All', 'Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'] as const).map((tab) => {
                                                                                const style = getTabStyle(tab);
                                                                                const isActive = activeTab === tab;
                                                                                const filterItem = INVOICE_STATUS_FILTERS.find(f => f.tabKey === tab);
                                                                                return (
                                                                                    <button
                                                                                        key={tab}
                                                                                        type="button"
                                                                                        onClick={(e) => {
                                                                                            e.preventDefault();
                                                                                            e.stopPropagation();
                                                                                            if (filterItem) setActiveSection(filterItem.id);
                                                                                        }}
                                                                                        className={`relative px-4 py-2 text-sm font-medium transition-all rounded-t-md ${isActive ? `${style.activeText} ${style.activeBg} shadow-sm` : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                                                                                    >
                                                                                        <span className="inline-flex items-center gap-2">
                                                                                            {tab}
                                                                                            <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${style.count}`}>
                                                                                                {getTabCount(tab)}
                                                                                            </span>
                                                                                        </span>
                                                                                        {isActive && <span className={`absolute left-0 right-0 -bottom-0.5 h-0.5 ${style.underline} rounded`} />}
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </TableHead>
                                                            </TableRow>
                                                             <TableRow className="hover:bg-transparent border-b bg-white">
                                                                <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-16">S.No</TableHead>
                                                                <TableHead className="py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Invoice #</TableHead>
                                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</TableHead>
                                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Work Order</TableHead>
                                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Issue Date</TableHead>
                                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Amount</TableHead>
                                                                <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                                                                <TableHead className="text-right px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {invoices.length === 0 ? (
                                                                <TableRow>
                                                                    <TableCell colSpan={7} className="text-center py-12">
                                                                        <NoDataAnimation />
                                                                    </TableCell>
                                                                </TableRow>
                                                            ) : (
                                                              invoices.map((invoice: any, idx: number) => (
                                                                    <tr key={invoice.id} className="group border-b hover:bg-slate-50 transition-colors bg-white cursor-pointer" onClick={() => setSelectedInvoice(invoice)}>
                                                                        <td className="py-5 px-6 text-xs font-black text-slate-400">{String(idx + 1).padStart(2, '0')}</td>
                                                                        <td className="py-5 px-2 text-sm font-black text-slate-900">{invoice.invoiceNumber}</td>
                                                                        <td className="py-5 px-2">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-black text-white shadow-lg shadow-cyan-100 uppercase">
                                                                                    {invoice.Customer?.name?.charAt(0)}
                                                                                </div>
                                                                                <div>
                                                                                    <div className="font-black text-sm text-slate-900 tracking-tight">{invoice.Customer?.name}</div>
                                                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{invoice.Customer?.phone || invoice.Customer?.email}</div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-5 px-2">
                                                                            <Badge variant="outline" className="border-cyan-100 bg-cyan-50/50 text-cyan-600 font-black text-[10px] uppercase tracking-widest px-2 py-1 rounded-lg">
                                                                                {invoice.WorkOrder?.orderNumber || 'Standalone'}
                                                                            </Badge>
                                                                        </td>
                                                                        <td className="py-5 px-2 font-bold text-xs text-slate-500">
                                                                            {new Date(invoice.invoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                                        </td>
                                                                        <td className="py-5 px-2 font-black text-sm text-slate-900">
                                                                            ${invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                        </td>
                                                                        <td className="py-5 px-2" onClick={(e) => e.stopPropagation()}>
                                                                            <Select
                                                                                value={invoice.status}
                                                                                onValueChange={(val) => handleStatusChange(invoice.id, val)}
                                                                                disabled={invoice.status === 'CANCELLED'}
                                                                            >
                                                                                <SelectTrigger className="border-none p-0 h-auto w-auto focus:ring-0 bg-transparent shadow-none hover:bg-transparent">
                                                                                    <Badge className={cn(
                                                                                        "rounded-full px-3 py-1 font-black text-[10px] border-none uppercase tracking-widest cursor-pointer",
                                                                                        invoice.status === 'PAID' ? "bg-emerald-100 text-emerald-700" :
                                                                                            invoice.status === 'SENT' ? "bg-cyan-100 text-cyan-700" :
                                                                                                invoice.status === 'OVERDUE' ? "bg-rose-100 text-rose-700" :
                                                                                                    "bg-slate-100 text-slate-700"
                                                                                    )}>
                                                                                        {invoice.status}
                                                                                    </Badge>
                                                                                </SelectTrigger>
                                                                                <SelectContent className="rounded-2xl border-none shadow-2xl p-2 min-w-[140px]">
                                                                                    <SelectItem value="DRAFT" className="rounded-xl font-black text-[10px] uppercase tracking-widest">Draft</SelectItem>
                                                                                    <SelectItem value="SENT" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-cyan-600">Sent</SelectItem>
                                                                                    <SelectItem value="PAID" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-emerald-600">Paid</SelectItem>
                                                                                    <SelectItem value="OVERDUE" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-rose-600">Overdue</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </td>
                                                                        <td className="py-5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-cyan-50 text-slate-400 hover:text-cyan-600 transition-colors">
                                                                                        <MoreHorizontal className="h-5 w-5" />
                                                                                    </Button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[200px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
                                                                                    <DropdownMenuItem onClick={() => setSelectedInvoice(invoice)} className="rounded-xl py-3 px-4 font-black text-[10px] uppercase tracking-widest text-slate-600 gap-3 focus:bg-slate-50 focus:text-slate-900 cursor-pointer">
                                                                                        <Eye className="h-4 w-4 text-cyan-500" /> View Detailed Summary
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem onClick={() => { setEditingInvoice(invoice); setIsCreating(true); }} className="rounded-xl py-3 px-4 font-black text-[10px] uppercase tracking-widest text-slate-600 gap-3 focus:bg-slate-50 focus:text-slate-900 cursor-pointer">
                                                                                        <Pencil className="h-4 w-4 text-blue-500" /> Modify record
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem onClick={() => handleDownload(invoice.id, invoice.invoiceNumber)} className="rounded-xl py-3 px-4 font-black text-[10px] uppercase tracking-widest text-cyan-700 bg-cyan-50/50 gap-3 focus:bg-cyan-100 focus:text-cyan-800 cursor-pointer">
                                                                                        <Download className="h-4 w-4" /> Download PDF Payload
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuSeparator className="my-1 opacity-50" />
                                                                                    <DropdownMenuItem
                                                                                        onClick={() => handleCancelClick(invoice)}
                                                                                        disabled={invoice.status === 'CANCELLED'}
                                                                                        className="rounded-xl py-3 px-4 font-black text-[10px] uppercase tracking-widest text-rose-600 gap-3 focus:bg-rose-50 focus:text-rose-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                                                    >
                                                                                        <Ban className="h-4 w-4" /> Cancel record
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>


            {/* Invoice Detail Modal */}
            <InvoiceDetail
                invoice={selectedInvoice}
                isOpen={!!selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
                onDownload={handleDownload}
                onStatusChange={handleStatusChange}
                onEdit={(invoice) => {
                    setSelectedInvoice(null);
                    setEditingInvoice(invoice);
                    setIsCreating(true);
                }}
            />

            {/* Cancel Invoice Dialog */}
            <Dialog open={!!invoiceToCancel} onOpenChange={(open) => !open && setInvoiceToCancel(null)}>
                <DialogContent className="sm:max-w-[500px] rounded-[32px] border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-8 bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center">
                                <Ban className="h-6 w-6 text-rose-600" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Cancel Invoice</DialogTitle>
                                <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    #{invoiceToCancel?.invoiceNumber}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-4">
                            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
                            <p className="text-xs font-bold text-rose-700 leading-relaxed">
                                This action will move the invoice to the <span className="underline">Cancelled</span> section. This cannot be undone through direct status updates.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Reason for Cancellation</Label>
                            <Textarea
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Why is this invoice being cancelled?"
                                className="rounded-2xl border-slate-200 min-h-[120px] bg-slate-50/50 focus:bg-white transition-all font-medium p-6 resize-none"
                                autoFocus
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setInvoiceToCancel(null)}
                            className="rounded-xl h-12 px-6 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                        >
                            Nevermind
                        </Button>
                        <Button
                            onClick={confirmCancellation}
                            disabled={!cancelReason.trim() || cancelInvoiceMutation.isPending}
                            className="rounded-xl h-12 px-8 font-black text-[10px] uppercase tracking-widest bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {cancelInvoiceMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                "Confirm Cancellation"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
