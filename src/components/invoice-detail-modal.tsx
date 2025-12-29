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
    ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvoiceDetailProps {
    invoice: any;
    isOpen: boolean;
    onClose: () => void;
    onDownload: (id: string, number: string) => void;
}

export function InvoiceDetail({ invoice, isOpen, onClose, onDownload }: InvoiceDetailProps) {
    if (!invoice) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] p-0 border-none shadow-2xl">
                <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-xl hover:bg-gray-100">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <DialogTitle className="text-xl font-black text-gray-900">
                                Invoice {invoice.invoiceNumber}
                            </DialogTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge className={cn(
                                    "rounded-full px-3 py-0.5 font-black text-[10px] border-none",
                                    invoice.status === 'PAID' ? "bg-emerald-100 text-emerald-700" :
                                        invoice.status === 'SENT' ? "bg-amber-100 text-amber-700" :
                                            invoice.status === 'OVERDUE' ? "bg-rose-100 text-rose-700" :
                                                "bg-gray-100 text-gray-700"
                                )}>
                                    {invoice.status}
                                </Badge>
                                <span className="text-xs text-gray-400 font-bold tracking-wider">
                                    ISSUED ON {formatDate(invoice.invoiceDate)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => onDownload(invoice.id, invoice.invoiceNumber)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-4"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download PDF
                        </Button>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    {/* Brand/Yard info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-900 text-white p-6 rounded-[24px] shadow-lg">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">From</h3>
                            <p className="text-sm font-black mb-1">{invoice.Organization?.name || 'AUSSIE SCRAPX'}</p>
                            <span className="text-xs text-slate-400 line-clamp-2">{invoice.Organization?.address}</span>
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <span className="text-xs text-slate-400">Direct: {invoice.Organization?.phone}</span>
                            </div>
                        </div>

                        <div className="bg-blue-50/50 p-6 rounded-[24px] border border-blue-100">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-3">Processing Yard</h3>
                            <p className="text-sm font-black text-slate-900 mb-1">{invoice.WorkOrder?.scrap_yards?.yardName || 'Main Processing Center'}</p>
                            <span className="text-xs text-slate-500 line-clamp-2">{invoice.WorkOrder?.scrap_yards?.address || 'On-site Collection'}</span>
                        </div>

                        <div className="bg-emerald-50/50 p-6 rounded-[24px] border border-emerald-100">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">Billed To</h3>
                            <p className="text-sm font-black text-slate-900 mb-1">{invoice.Customer?.name}</p>
                            <span className="text-xs text-slate-500 line-clamp-1">{invoice.Customer?.email}</span>
                            <span className="text-xs text-slate-500">{invoice.Customer?.phone}</span>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-[24px] border border-slate-100 shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400">Description</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-center">Qty</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Unit Price</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50">
                                {invoice.items?.map((item: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{item.description}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-500 text-center">{item.quantity}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-slate-500 text-right">${item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className="px-6 py-4 text-sm font-black text-slate-900 text-right">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex-1 space-y-6">
                            {invoice.notes && (
                                <div className="p-6 bg-slate-50 rounded-[24px]">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Notes & Instructions</h4>
                                    <p className="text-sm text-slate-600 italic">"{invoice.notes}"</p>
                                </div>
                            )}
                            <div className="flex gap-4">
                                <Badge className="bg-blue-600/10 text-blue-600 border-none px-4 py-2 rounded-xl font-bold">
                                    Ref: {invoice.WorkOrder?.orderNumber || 'DIRECT'}
                                </Badge>
                                <Badge className="bg-slate-100 text-slate-600 border-none px-4 py-2 rounded-xl font-bold">
                                    Method: Bank Transfer
                                </Badge>
                            </div>
                        </div>

                        <div className="w-full md:w-[350px] bg-slate-900 text-white p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-center text-slate-400">
                                    <span className="text-xs font-bold">Subtotal</span>
                                    <span className="text-sm font-bold">${invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-blue-400">
                                    <span className="text-xs font-bold">G.S.T (10%)</span>
                                    <span className="text-sm font-bold">+ ${invoice.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                {invoice.discount > 0 && (
                                    <div className="flex justify-between items-center text-rose-400">
                                        <span className="text-xs font-bold">Adjustment</span>
                                        <span className="text-sm font-bold">- ${invoice.discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                <div className="pt-6 border-t border-white/10 mt-6">
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Grand Total Due</span>
                                            <span className="text-3xl font-black">${invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
