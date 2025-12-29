'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { InvoiceForm } from '@/components/invoice-form';
import { InvoiceDetail } from '@/components/invoice-detail-modal';
import { toast } from 'sonner';
import { useInvoices, useCreateInvoice, useInvoiceStats, useDeleteInvoice, useUpdateInvoiceStatus, useUpdateInvoice } from '@/hooks/use-invoices';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { invoicesApi } from '@/lib/api/invoices';

// Sidebar navigation items for invoice module
const INVOICE_STATUS_FILTERS = [
    { id: 'all', label: 'All Invoices', icon: FileText, status: undefined, color: 'bg-blue-500' },
    { id: 'draft', label: 'Drafts', icon: FileText, status: 'DRAFT', color: 'bg-gray-500' },
    { id: 'sent', label: 'Sent', icon: Clock, status: 'SENT', color: 'bg-amber-500' },
    { id: 'paid', label: 'Paid', icon: CheckCircle2, status: 'PAID', color: 'bg-emerald-500' },
    { id: 'overdue', label: 'Overdue', icon: AlertCircle, status: 'OVERDUE', color: 'bg-rose-500' },
    { id: 'cancelled', label: 'Cancelled', icon: XCircle, status: 'CANCELLED', color: 'bg-slate-500' },
];

export default function InvoicesPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeSection, setActiveSection] = useState('all');
    const [isCreating, setIsCreating] = useState(false);
    const [prefillWorkOrderId, setPrefillWorkOrderId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [editingInvoice, setEditingInvoice] = useState<any>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const activeItem = INVOICE_STATUS_FILTERS.find(item => item.id === activeSection);

    // Fetch invoices based on active status
    const { data: invoicesData, isLoading: isLoadingInvoices, refetch: refetchInvoices } = useInvoices({
        status: activeItem?.status,
        search: debouncedSearch || undefined,
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
        totalRevenue: 0,
        pendingRevenue: 0
    };

    // Mutations
    const createInvoiceMutation = useCreateInvoice();
    const deleteInvoiceMutation = useDeleteInvoice();
    const updateStatusMutation = useUpdateInvoiceStatus();
    const updateInvoiceMutation = useUpdateInvoice();

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await updateStatusMutation.mutateAsync({ id, status: newStatus });
            refetchStats();
        } catch (error) {
            console.error('Failed to update status:', error);
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

    const handleDeleteInvoice = async (id: string) => {
        if (!confirm('Are you sure you want to delete this invoice?')) return;
        try {
            await deleteInvoiceMutation.mutateAsync(id);
            toast.success('Invoice deleted successfully');
            refetchInvoices();
            refetchStats();
        } catch (error: any) {
            toast.error('Failed to delete invoice');
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

    // Premium Stat Card Component
    function StatCard({
        title,
        value,
        color,
        icon: Icon,
        delay = 0
    }: {
        title: string;
        value: number | string;
        color: string;
        icon: any;
        delay?: number;
    }) {
        const getGradient = (c: string) => {
            switch (c) {
                case 'cyan': return 'from-cyan-500 to-blue-600 shadow-cyan-200/50';
                case 'yellow': return 'from-amber-400 to-orange-500 shadow-orange-200/50';
                case 'green': return 'from-emerald-400 to-green-600 shadow-green-200/50';
                case 'red': return 'from-rose-500 to-red-700 shadow-red-200/50';
                default: return 'from-gray-400 to-gray-600 shadow-gray-200/50';
            }
        };

        return (
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={cn(
                    "relative overflow-hidden group h-[120px] rounded-[24px] p-0.5 transition-all duration-500 shadow-lg",
                    getGradient(color)
                )}
            >
                <div className={cn("absolute inset-0 bg-gradient-to-br", getGradient(color).split(' ').slice(0, 2).join(' '))} />
                <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] m-1 rounded-[22px] border border-white/20 z-10" />
                <div className="relative z-30 flex flex-col justify-between h-full p-4 text-white">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-white/80 uppercase tracking-wider mb-1">{title}</p>
                            <div className="text-2xl font-black tracking-tight">
                                {value}
                            </div>
                        </div>
                        <div className="p-2 bg-white/20 backdrop-blur-xl rounded-xl border border-white/30 group-hover:rotate-12 transition-transform duration-500">
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Invoices</h1>
                    <p className="text-gray-500 mt-1">Manage billing and payments</p>
                </div>
                {!isCreating && (
                    <Button
                        onClick={() => setIsCreating(true)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold h-12 px-6 rounded-2xl shadow-lg hover:shadow-cyan-200/50 transition-all duration-300"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Invoice
                    </Button>
                )}
            </div>

            {/* Stats Overview */}
            {!isCreating && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total" value={stats.total} color="cyan" icon={FileText} delay={0} />
                    <StatCard title="Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} color="green" icon={DollarSign} delay={0.1} />
                    <StatCard title="Pending" value={`$${stats.pendingRevenue.toLocaleString()}`} color="yellow" icon={Clock} delay={0.2} />
                    <StatCard title="Overdue" value={stats.overdue} color="red" icon={AlertCircle} delay={0.3} />
                </div>
            )}

            {/* Main Area */}
            <Card className="border-none shadow-xl rounded-[32px] overflow-hidden bg-white/50 backdrop-blur-sm">
                <CardHeader className="p-6 md:p-8 bg-white border-b border-gray-100">
                    <div className="flex flex-col space-y-6">
                        <div className="flex border-b border-gray-100 pb-2 overflow-x-auto no-scrollbar gap-2">
                            {INVOICE_STATUS_FILTERS.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeSection === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setActiveSection(item.id);
                                            setIsCreating(false);
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-300 whitespace-nowrap font-bold text-sm",
                                            isActive && !isCreating
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-200 translate-y-[-2px]"
                                                : "text-gray-500 hover:bg-gray-50 bg-transparent"
                                        )}
                                    >
                                        <Icon className={cn("h-4 w-4", isActive && !isCreating ? "text-white" : "text-gray-400")} />
                                        {item.label}
                                        {!isCreating && (
                                            <span className={cn(
                                                "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black",
                                                isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                                            )}>
                                                {item.id === 'all' ? stats.total : (stats as any)[item.id] || 0}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {!isCreating && (
                            <div className="flex items-center justify-between gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search invoice # or customer..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-gray-50 border-none rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                    />
                                </div>
                                <Button variant="outline" className="rounded-2xl border-gray-200 font-bold h-11 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filters
                                </Button>
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <AnimatePresence mode="wait">
                        {isCreating ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="p-6 md:p-8"
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
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-6 md:p-8"
                            >
                                {isLoadingInvoices ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 space-y-4">
                                        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                                        <p className="font-bold">Syncing invoices...</p>
                                    </div>
                                ) : invoices.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="text-left text-[11px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-100 pb-4">
                                                    <th className="pb-4 pt-0 px-2">Invoice #</th>
                                                    <th className="pb-4 pt-0 px-2">Customer</th>
                                                    <th className="pb-4 pt-0 px-2">Work Order</th>
                                                    <th className="pb-4 pt-0 px-2">Issue Date</th>
                                                    <th className="pb-4 pt-0 px-2">Amount</th>
                                                    <th className="pb-4 pt-0 px-2">Status</th>
                                                    <th className="pb-4 pt-0 px-2 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {invoices.map((invoice: any) => (
                                                    <tr key={invoice.id} className="group hover:bg-blue-50/50 transition-colors duration-200">
                                                        <td className="py-4 px-2">
                                                            <div className="font-black text-sm text-gray-900">{invoice.invoiceNumber}</div>
                                                        </td>
                                                        <td className="py-4 px-2">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                                    {invoice.Customer?.name?.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-sm text-gray-900">{invoice.Customer?.name}</div>
                                                                    <div className="text-[10px] text-gray-400 font-medium">{invoice.Customer?.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-2">
                                                            <div className="font-bold text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg inline-block">
                                                                {invoice.WorkOrder?.orderNumber || 'Standalone'}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-2">
                                                            <div className="text-sm font-semibold text-gray-600">
                                                                {new Date(invoice.invoiceDate).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-2">
                                                            <div className="text-sm font-black text-gray-900">
                                                                ${invoice.total.toLocaleString()}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-2">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <div className="cursor-pointer group/status inline-block">
                                                                        <Badge className={cn(
                                                                            "rounded-full px-3 py-1 font-black text-[10px] border-none transition-all duration-300 group-hover/status:ring-2 group-hover/status:ring-blue-100",
                                                                            invoice.status === 'PAID' ? "bg-emerald-100 text-emerald-700" :
                                                                                invoice.status === 'SENT' ? "bg-amber-100 text-amber-700" :
                                                                                    invoice.status === 'OVERDUE' ? "bg-rose-100 text-rose-700" :
                                                                                        invoice.status === 'DRAFT' ? "bg-gray-100 text-gray-700" :
                                                                                            "bg-slate-100 text-slate-700"
                                                                        )}>
                                                                            {invoice.status}
                                                                        </Badge>
                                                                    </div>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="start" className="rounded-2xl p-2 min-w-[140px] border-none shadow-2xl">
                                                                    {['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'].map((status) => (
                                                                        <DropdownMenuItem
                                                                            key={status}
                                                                            onClick={() => handleStatusChange(invoice.id, status)}
                                                                            className={cn(
                                                                                "rounded-xl font-bold gap-2 focus:bg-blue-50 focus:text-blue-700 cursor-pointer text-[10px] tracking-widest transition-colors",
                                                                                invoice.status === status ? "text-blue-600 bg-blue-50" : "text-gray-600"
                                                                            )}
                                                                        >
                                                                            {status}
                                                                        </DropdownMenuItem>
                                                                    ))}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                        <td className="py-4 px-2 text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-blue-50 transition-colors">
                                                                        <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="rounded-2xl p-2 min-w-[160px] border-none shadow-2xl">
                                                                    <DropdownMenuItem
                                                                        onClick={() => setSelectedInvoice(invoice)}
                                                                        className="rounded-xl font-bold text-gray-600 gap-2 focus:bg-blue-50 focus:text-gray-900 cursor-pointer transition-colors"
                                                                    >
                                                                        <Eye className="h-4 w-4" /> View Details
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => {
                                                                            setEditingInvoice(invoice);
                                                                            setIsCreating(true);
                                                                        }}
                                                                        className="rounded-xl font-bold text-gray-600 gap-2 focus:bg-blue-50 focus:text-gray-900 cursor-pointer transition-colors"
                                                                    >
                                                                        <Pencil className="h-4 w-4" /> Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDownload(invoice.id, invoice.invoiceNumber)}
                                                                        className="rounded-xl font-bold text-blue-600 gap-2 focus:bg-blue-50 focus:text-blue-700 cursor-pointer transition-colors"
                                                                    >
                                                                        <Download className="h-4 w-4" /> Download PDF
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator className="my-1 bg-gray-50" />
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleDeleteInvoice(invoice.id)}
                                                                        className="rounded-xl font-bold text-rose-600 gap-2 focus:bg-rose-50 cursor-pointer"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" /> Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-6">
                                        <div className="h-24 w-24 rounded-[32px] bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                            <FileText className="h-12 w-12 text-gray-200" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-xl font-black text-gray-900 mb-2">No Invoices Found</h3>
                                            <p className="text-gray-500 font-bold max-w-xs mx-auto">
                                                We couldn't find any invoices matching your criteria.
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => setIsCreating(true)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-2xl shadow-xl shadow-blue-100"
                                        >
                                            Create First Invoice
                                        </Button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>

            <InvoiceDetail
                invoice={selectedInvoice}
                isOpen={!!selectedInvoice}
                onClose={() => setSelectedInvoice(null)}
                onDownload={handleDownload}
            />
        </div>
    );
}
