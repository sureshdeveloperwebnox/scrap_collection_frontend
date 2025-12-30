'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Download,
    Printer,
    Calendar,
    User,
    FileText,
    CreditCard,
    ArrowLeft,
    Edit2,
    Building2,
    Mail,
    Phone,
    Package,
    ArrowRight,
    Clock,
    ShoppingCart,
    ChevronDown
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface InvoiceDetailProps {
    invoice: any;
    isOpen: boolean;
    onClose: () => void;
    onDownload: (id: string, number: string) => void;
    onEdit?: (invoice: any) => void;
    onStatusChange?: (id: string, status: string) => void;
}

export function InvoiceDetail({ invoice, isOpen, onClose, onDownload, onEdit, onStatusChange }: InvoiceDetailProps) {
    if (!invoice) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[1000px] max-h-[95vh] overflow-y-auto rounded-[40px] p-0 border-none shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] bg-white">
                {/* Premium Header */}
                <div className="sticky top-0 bg-white/90 backdrop-blur-xl z-50 px-10 py-8 border-b border-slate-100/50 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-2xl h-12 w-12 hover:bg-slate-100 transition-all active:scale-95">
                            <ArrowLeft className="h-6 w-6 text-slate-400" />
                        </Button>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                                    Invoice <span className="text-cyan-500">#{invoice.invoiceNumber}</span>
                                </DialogTitle>
                                 <Select
                                    value={invoice.status}
                                    onValueChange={(val) => onStatusChange?.(invoice.id, val)}
                                    disabled={invoice.status === 'CANCELLED'}
                                >
                                    <SelectTrigger className="border-none p-0 h-auto w-auto focus:ring-0 bg-transparent shadow-none hover:bg-transparent">
                                        <Badge className={cn(
                                            "rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-[0.2em] border-none shadow-sm cursor-pointer",
                                            invoice.status === 'PAID' ? "bg-emerald-500 text-white" :
                                                invoice.status === 'SENT' ? "bg-cyan-500 text-white" :
                                                    invoice.status === 'OVERDUE' ? "bg-rose-500 text-white" :
                                                        "bg-slate-400 text-white"
                                        )}>
                                            {invoice.status}
                                        </Badge>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl p-2 min-w-[140px]">
                                        <SelectItem value="DRAFT" className="rounded-xl font-black text-[10px] uppercase tracking-widest cursor-pointer">Draft</SelectItem>
                                        <SelectItem value="SENT" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-cyan-600 cursor-pointer">Sent</SelectItem>
                                        <SelectItem value="PAID" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-emerald-600 cursor-pointer">Paid</SelectItem>
                                        <SelectItem value="OVERDUE" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-rose-600 cursor-pointer">Overdue</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 tracking-tight">
                                <Calendar className="h-3.5 w-3.5" />
                                Issued on {formatDate(invoice.invoiceDate)}
                                <span className="mx-1">•</span>
                                <Clock className="h-3.5 w-3.5" />
                                Due on {formatDate(invoice.dueDate)}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {onEdit && (
                            <Button
                                variant="outline"
                                onClick={() => onEdit(invoice)}
                                className="rounded-2xl h-12 px-6 border-slate-200 hover:bg-slate-50 font-black text-xs uppercase tracking-widest text-slate-600 transition-all active:scale-95"
                            >
                                <Edit2 className="h-4 w-4 mr-3 text-cyan-500" />
                                Edit Entry
                            </Button>
                        )}
                        <Button
                            onClick={() => onDownload(invoice.id, invoice.invoiceNumber)}
                            className="bg-slate-900 hover:bg-black text-white font-black rounded-2xl h-12 px-8 shadow-xl shadow-slate-200 transition-all active:scale-95"
                        >
                            <Download className="h-4 w-4 mr-3" />
                            GET PDF
                        </Button>
                    </div>
                </div>

                <div className="p-10 space-y-10">
                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* From Section */}
                        <div className="relative group p-8 rounded-[32px] bg-white border border-slate-200 shadow-md overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-white" />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Issuer</h3>
                                </div>
                                <div>
                                    <p className="text-base font-black text-slate-900 tracking-tight">{invoice.Organization?.name || 'AUSSIE SCRAPX'}</p>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">{invoice.Organization?.address || 'Australia Disposal Center'}</p>
                                </div>
                                <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                    <Phone className="h-3 w-3" />
                                    {invoice.Organization?.phone || '+61 XXX-XXX-XXX'}
                                </div>
                            </div>
                        </div>

                        {/* Processing Yard */}
                        <div className="relative group p-8 rounded-[32px] bg-white border border-slate-200 shadow-md overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-1 hover:border-cyan-200">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-cyan-50 flex items-center justify-center border border-cyan-100">
                                        <Package className="h-5 w-5 text-cyan-600" />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600">Processing Yard</h3>
                                </div>
                                <div>
                                    <p className="text-base font-black text-slate-900 tracking-tight">{invoice.WorkOrder?.scrap_yards?.yardName || 'Direct Processing'}</p>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2">{invoice.WorkOrder?.scrap_yards?.address || 'Disposal Point Verified'}</p>
                                </div>
                                <div className="pt-4 border-t border-slate-50 flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                    <Package className="h-3 w-3" />
                                    Work Order: {invoice.WorkOrder?.orderNumber || 'Direct Invoice'}
                                </div>
                            </div>
                        </div>

                        {/* Billed To */}
                        <div className="relative group p-8 rounded-[32px] bg-white border border-slate-200 shadow-md overflow-hidden transition-all duration-500 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 hover:border-emerald-200">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                        <User className="h-5 w-5 text-emerald-600" />
                                    </div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Billed To</h3>
                                </div>
                                <div>
                                    <p className="text-base font-black text-slate-900 tracking-tight">{invoice.Customer?.name}</p>
                                    <div className="mt-2 space-y-1">
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                            <Mail className="h-3 w-3 opacity-50" /> {invoice.Customer?.email}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                            <Phone className="h-3 w-3 opacity-50" /> {invoice.Customer?.phone}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 px-2">
                            <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center">
                                <ShoppingCart className="h-4 w-4 text-white" />
                            </div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Itemized Service Breakdown</h3>
                        </div>

                        <div className="overflow-hidden rounded-[32px] border border-slate-100 shadow-sm bg-white">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 border-b border-slate-100 text-center">
                                    <tr>
                                        <th className="px-6 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest w-16">S.No</th>
                                        <th className="px-6 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">Service Description</th>
                                        <th className="px-4 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Unit Count</th>
                                        <th className="px-6 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Unit Rate</th>
                                        <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Line Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {invoice.items?.map((item: any, idx: number) => (
                                        <tr key={idx} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-6 text-center text-xs font-black text-slate-400">
                                                {String(idx + 1).padStart(2, '0')}
                                            </td>
                                            <td className="px-6 py-6 text-left">
                                                <p className="text-sm font-bold text-slate-900 tracking-tight">{item.description}</p>
                                            </td>
                                            <td className="px-4 py-6 text-center">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-black text-xs h-8 px-4 rounded-lg">
                                                    {item.quantity}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-6 text-right font-bold text-slate-500 text-sm">
                                                ${item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-10 py-6 text-right font-black text-slate-900 text-sm">
                                                ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Simplified Summary & Totals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mt-12 bg-slate-50/50 rounded-[40px] p-10 border border-slate-100">
                        <div className="space-y-8">
                            {invoice.notes && (
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                                        Important Disclaimers
                                    </h4>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed p-6 bg-white rounded-2xl border border-slate-100 italic shadow-sm">
                                        "{invoice.notes}"
                                    </p>
                                </div>
                            )}

                            {invoice.status === 'CANCELLED' && invoice.cancelReason && (
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                                        Cancellation Reason
                                    </h4>
                                    <p className="text-sm text-rose-600 font-bold leading-relaxed p-6 bg-rose-50 rounded-2xl border border-rose-100 italic shadow-sm">
                                        "{invoice.cancelReason}"
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Simplified Totals Card */}
                        <div className="bg-white border-2 border-slate-200 p-10 rounded-[40px] shadow-xl relative overflow-hidden self-center w-full">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                            <div className="space-y-5 relative z-10">
                                <div className="flex justify-between items-center text-slate-500">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Base Amount</span>
                                    <span className="text-lg font-black text-slate-900">${invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-cyan-600">
                                    <span className="text-[10px] font-black uppercase tracking-widest">Tax</span>
                                    <span className="text-lg font-black">+ ${invoice.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                {invoice.discount > 0 && (
                                    <div className="flex justify-between items-center text-rose-600">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Total Adjustments</span>
                                        <span className="text-lg font-black">- ${invoice.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}

                                <div className="pt-8 border-t border-slate-100 mt-8">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] block mb-2">Final Settlement</span>
                                            <span className="text-5xl font-black text-slate-900 tracking-tighter">
                                                ${invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
