'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useCustomers } from '@/hooks/use-customers';
import { useOrders, useOrder } from '@/hooks/use-orders';
import { useInvoiceHistory } from '@/hooks/use-invoices';
import { toast } from 'sonner';
import {
    Plus,
    Trash2,
    User,
    FileText,
    DollarSign,
    Calendar as CalendarIcon,
    Loader2,
    History,
    Clock,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    Info,
    Package,
    ShoppingCart,
    X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface LineItem {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

interface InvoiceFormData {
    customerId: string;
    workOrderId?: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    items: LineItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    notes?: string;
}

interface InvoiceFormProps {
    onCancel: () => void;
    prefillWorkOrderId?: string | null;
    initialData?: any;
    onSubmit: (data: InvoiceFormData) => void;
}

export function InvoiceForm({ onCancel, prefillWorkOrderId, initialData, onSubmit }: InvoiceFormProps) {
    const isEditing = !!initialData;
    const [currentStep, setCurrentStep] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);

    // Fetch history if editing
    const { data: historyRes, isLoading: isLoadingHistory } = useInvoiceHistory(initialData?.id || null, {
        page: historyPage,
        limit: 5
    });
    const history = historyRes?.data?.history || [];
    const pagination = historyRes?.data?.pagination;

    const [customerId, setCustomerId] = useState(initialData?.customerId || '');
    const [workOrderId, setWorkOrderId] = useState(initialData?.workOrderId || prefillWorkOrderId || '');
    const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoiceNumber || `INV-${Date.now()}`);
    const [invoiceDate, setInvoiceDate] = useState(
        initialData?.invoiceDate
            ? new Date(initialData.invoiceDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
    );
    const [dueDate, setDueDate] = useState(
        initialData?.dueDate
            ? new Date(initialData.dueDate).toISOString().split('T')[0]
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [items, setItems] = useState<LineItem[]>(
        initialData?.items?.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount
        })) || [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }]
    );
    const [taxRate, setTaxRate] = useState(initialData ? (initialData.tax / initialData.subtotal) * 100 : 10);
    const [discount, setDiscount] = useState(initialData?.discount || 0);
    const [notes, setNotes] = useState(initialData?.notes || '');

    // Fetch customers
    const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({ limit: 100 });
    const customers = customersData?.data?.customers || [];

    // Fetch all orders for current customer
    const { data: ordersData, isLoading: isLoadingOrders } = useOrders({
        customerId: customerId || undefined,
        limit: 100,
    });
    const orders = ordersData?.data?.orders || [];

    // Fetch pre-filled order if exists
    const { data: prefilledOrderData, isLoading: isLoadingPrefilledOrder } = useOrder(prefillWorkOrderId || '');
    const prefilledOrder = prefilledOrderData?.data;

    // Handle pre-fill logic
    useEffect(() => {
        if (prefilledOrder && !initialData) {
            if (prefilledOrder.customerId) {
                setCustomerId(prefilledOrder.customerId);
            }
            if (prefilledOrder.id) {
                setWorkOrderId(prefilledOrder.id);
            }

            // Optionally prefill invoice items from order vehicle details
            if (prefilledOrder.vehicleDetails && items[0].description === '') {
                const vehicle = prefilledOrder.vehicleDetails as any;
                const desc = `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} (${vehicle.condition || 'Scrap'})`.trim();
                setItems([{
                    description: desc || 'Scrap Collection',
                    quantity: 1,
                    unitPrice: prefilledOrder.actualPrice || prefilledOrder.quotedPrice || 0,
                    amount: prefilledOrder.actualPrice || prefilledOrder.quotedPrice || 0
                }]);
            }
        }
    }, [prefilledOrder, initialData]);

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const totalValue = subtotal + taxAmount - discount;

    const handleItemChange = (index: number, field: keyof LineItem, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
            newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
        }
        setItems(newItems);
    };

    const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
    const removeItem = (index: number) => items.length > 1 && setItems(items.filter((_, i) => i !== index));

    const handleSubmit = () => {
        if (!customerId) return toast.error('Please select a customer');
        if (!invoiceNumber) return toast.error('Please enter an invoice number');
        if (items.some(item => !item.description)) return toast.error('Please fill in all item descriptions');

        const formData: InvoiceFormData = {
            customerId,
            workOrderId: (workOrderId && workOrderId !== 'none') ? workOrderId : undefined,
            invoiceNumber,
            invoiceDate,
            dueDate,
            items,
            subtotal,
            tax: taxAmount,
            discount,
            total: totalValue,
            notes: notes || undefined
        };

        onSubmit(formData);
    };

    const steps = [
        { id: 1, title: 'Customer', icon: User },
        { id: 2, title: 'Invoice Details', icon: FileText },
        { id: 3, title: 'Service Items', icon: ShoppingCart },
    ];

    return (
        <div className="w-full pb-32">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 px-12 pt-10">
                <Button variant="ghost" size="icon" onClick={onCancel} className="rounded-xl h-10 w-10 hover:bg-slate-100 transition-all">
                    <ArrowLeft className="h-5 w-5 text-slate-400" />
                </Button>
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {isEditing ? 'Modify Invoice Record' : 'Generate New Invoice'}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium">
                        {isEditing ? `Refining ${initialData.invoiceNumber}` : 'Complete the multi-step process to creates a professional bill'}
                    </p>
                </div>
            </div>

            {/* Stepper */}
            <div className="max-w-2xl mx-auto mb-12">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = currentStep === step.id;
                        const isCompleted = currentStep > step.id;

                        return (
                            <div key={step.id} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <button
                                        onClick={() => isCompleted && setCurrentStep(step.id)}
                                        className={cn(
                                            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm",
                                            isCompleted ? "bg-emerald-500 text-white" :
                                                isActive ? "bg-cyan-500 text-white shadow-cyan-200" :
                                                    "bg-white border border-slate-200 text-slate-400"
                                        )}
                                    >
                                        {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                                    </button>
                                    <p className={cn(
                                        "mt-2 text-[10px] font-black uppercase tracking-widest",
                                        isActive ? "text-cyan-600" : isCompleted ? "text-emerald-600" : "text-slate-400"
                                    )}>
                                        {step.title}
                                    </p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={cn(
                                        "h-1 flex-1 mx-4 rounded-full transition-all duration-500 mb-6",
                                        currentStep > step.id + 0.5 ? "bg-emerald-500" : "bg-slate-200"
                                    )} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="w-full px-12 pb-12">
                {currentStep === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-white border border-slate-200 rounded-[32px] p-10 shadow-xl shadow-slate-100/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Select Customer</Label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                            <User className="h-5 w-5 text-cyan-500" />
                                        </div>
                                        <Select value={customerId} onValueChange={setCustomerId}>
                                            <SelectTrigger className="pl-12 h-14 rounded-2xl border-slate-200 bg-white shadow-sm focus:ring-cyan-500 transition-all font-bold text-slate-700">
                                                <SelectValue placeholder={isLoadingCustomers ? "Loading..." : "Find a customer..."} />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px] rounded-2xl shadow-2xl border-none">
                                                {customers.map((c: any) => (
                                                    <SelectItem key={c.id} value={c.id} className="rounded-xl py-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-900">{c.name}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{c.phone || c.email}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Related Work Order</Label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                                            <Package className="h-5 w-5 text-cyan-500" />
                                        </div>
                                        <Select
                                            value={workOrderId || 'none'}
                                            onValueChange={setWorkOrderId}
                                            disabled={!customerId}
                                        >
                                            <SelectTrigger className="pl-12 h-14 rounded-2xl border-slate-200 bg-white shadow-sm disabled:bg-slate-50 font-bold text-slate-700">
                                                <SelectValue placeholder={!customerId ? "Select customer first" : "Find an active order..."} />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px] rounded-2xl shadow-2xl border-none">
                                                <SelectItem value="none" className="rounded-xl py-3 font-bold text-slate-400 italic">No Work Order</SelectItem>
                                                {orders.map((o: any) => (
                                                    <SelectItem key={o.id} value={o.id} className="rounded-xl py-3">
                                                        <div className="flex items-center justify-between gap-4">
                                                            <span className="font-extrabold text-slate-900">{o.orderNumber || o.id.slice(0, 8)}</span>
                                                            <Badge className="bg-cyan-50 text-cyan-600 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5">{o.orderStatus}</Badge>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-white border border-slate-200 rounded-[32px] p-10 shadow-xl shadow-slate-100/50 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Ref ID / Invoice Number</Label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                            <FileText className="h-5 w-5 text-cyan-500" />
                                        </div>
                                        <Input
                                            value={invoiceNumber}
                                            onChange={(e) => setInvoiceNumber(e.target.value)}
                                            className="pl-12 h-14 rounded-2xl border-slate-200 font-black text-slate-900 focus:ring-cyan-500 transition-all"
                                            placeholder="INV-XXXXX"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Date Issued</Label>
                                        <Input
                                            type="date"
                                            value={invoiceDate}
                                            onChange={(e) => setInvoiceDate(e.target.value)}
                                            className="h-14 rounded-2xl border-slate-200 font-bold text-slate-700 focus:ring-cyan-500"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Due By</Label>
                                        <Input
                                            type="date"
                                            value={dueDate}
                                            onChange={(e) => setDueDate(e.target.value)}
                                            className="h-14 rounded-2xl border-slate-200 font-bold text-slate-700 focus:ring-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Administrative Notes</Label>
                                <Textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Add any internal administrative notes here..."
                                    className="rounded-2xl border-slate-200 min-h-[140px] bg-slate-50/50 focus:bg-white transition-all font-medium p-6"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Service Items & History */}
                {currentStep === 3 && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-4">
                                    <div className="grid grid-cols-12 gap-4 mb-4 px-2">
                                        <div className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">S.No</div>
                                        <div className="col-span-11 flex items-center justify-between">
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                                <ShoppingCart className="h-4 w-4 text-emerald-500" />
                                                Line Items
                                            </h3>
                                            <Button type="button" onClick={addItem} size="sm" className="rounded-xl font-black bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-100 h-9 px-4 transition-all active:scale-95">
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Entry
                                            </Button>
                                        </div>
                                    </div>

                            <div className="space-y-4">
                                {items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-4 items-start p-6 bg-slate-50/50 border border-slate-100 rounded-[28px] relative group/item hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                        <div className="col-span-1 pt-8 text-center text-xs font-black text-slate-400">
                                            {String(index + 1).padStart(2, '0')}
                                        </div>
                                        <div className="col-span-11 md:col-span-5 space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Description</Label>
                                            <Input
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                placeholder="e.g., Scrap Metal Collection - Grade A"
                                                className="h-12 rounded-xl border-slate-200 bg-white font-bold focus:ring-cyan-500"
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-1.5 space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Qty</Label>
                                            <Input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                className="h-12 rounded-xl border-slate-200 bg-white font-black text-center focus:ring-cyan-500"
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-2 space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Rate</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                                                <Input
                                                    type="number"
                                                    value={item.unitPrice}
                                                    onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                    className="h-12 rounded-xl border-slate-200 bg-white font-black pl-8 focus:ring-cyan-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-3 md:col-span-2 space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1">Amount</Label>
                                            <div className="h-12 rounded-xl bg-white flex items-center px-4 font-black text-slate-900 border border-slate-200 shadow-sm">
                                                ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        <div className="col-span-1 flex items-end justify-end h-full pt-6">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeItem(index)}
                                                disabled={items.length === 1}
                                                className="h-12 w-12 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Simplified Totals Section */}
                        <div className="flex flex-col md:flex-row gap-8 items-start justify-end mt-12 bg-white border border-slate-200 p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl" />
                            <div className="w-full max-w-md space-y-6 relative z-10">
                                <div className="flex justify-between items-center text-slate-500">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Subtotal</span>
                                    <span className="text-lg font-black text-slate-900">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>

                                <div className="flex justify-between items-center text-cyan-600">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tax</span>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={taxRate}
                                                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                                className="w-16 h-8 bg-cyan-50 border border-cyan-100 rounded-xl text-xs font-black text-center text-cyan-700 outline-none focus:ring-1 focus:ring-cyan-500"
                                            />
                                            <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-xs font-black">%</span>
                                        </div>
                                    </div>
                                    <span className="text-lg font-black">+ ${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>

                                <div className="flex justify-between items-center text-rose-600">
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deductions</span>
                                        <div className="relative">
                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black">$</span>
                                            <input
                                                type="number"
                                                value={discount}
                                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                                className="w-24 h-8 bg-rose-50 border border-rose-100 rounded-xl text-xs font-black pl-6 text-rose-700 outline-none focus:ring-1 focus:ring-rose-500"
                                            />
                                        </div>
                                    </div>
                                    <span className="text-lg font-black">- ${discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>

                                <div className="pt-8 border-t border-slate-100 mt-8">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-2">Total Outstanding</p>
                                            <span className="text-5xl font-black text-slate-900 tracking-tighter">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <Badge className="bg-cyan-100 text-cyan-700 border-none text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg shadow-sm">Verified Amount</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* History Section */}
                        {isEditing && (
                            <div className="pt-10 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-6 px-2">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-blue-50 flex items-center justify-center">
                                            <History className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Amendment Records</h3>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                            className="h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                                            disabled={historyPage === 1 || isLoadingHistory}
                                        >
                                            Prev
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setHistoryPage(p => p + 1)}
                                            className="h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                                            disabled={!pagination || historyPage >= pagination.totalPages || isLoadingHistory}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>

                                <div className="border border-slate-200 rounded-[32px] overflow-hidden bg-white shadow-2xl shadow-slate-200/50 w-full mb-12">
                                    <div className="overflow-x-auto w-full">
                                        <table className="w-full min-w-full border-collapse table-fixed">
                                            <thead>
                                                <tr className="bg-slate-900 border-b border-slate-800">
                                                    <th className="w-[80px] px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">S.No</th>
                                                    <th className="w-[180px] px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Timestamp</th>
                                                    <th className="w-[160px] px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Operation</th>
                                                    <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Change Details</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {isLoadingHistory ? (
                                                    <tr><td colSpan={3} className="px-8 py-12 text-center"><Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" /></td></tr>
                                                ) : history.length > 0 ? (
                                                    history.map((log: any, idx: number) => (
                                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                            <td className="px-6 py-5 align-top text-xs font-black text-slate-400">
                                                                {String(idx + 1).padStart(2, '0')}
                                                            </td>
                                                            <td className="px-6 py-5 align-top whitespace-nowrap">
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs font-black text-slate-900">
                                                                        {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-5 align-top text-center">
                                                                <Badge className={cn(
                                                                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border-none whitespace-nowrap",
                                                                    log.action === 'CREATED' ? "bg-emerald-100 text-emerald-700" :
                                                                        log.action === 'STATUS_CHANGE' ? "bg-amber-100 text-amber-700" :
                                                                            "bg-blue-100 text-blue-700"
                                                                )}>
                                                                    {log.action.replace('_', ' ')}
                                                                </Badge>
                                                            </td>
                                                        <td className="px-6 py-5 align-top">
                                                            <div className="space-y-3">
                                                                {log.action === 'CREATED' ? (
                                                                    <span className="text-xs font-bold text-slate-400 italic tracking-tight">Initial record instantiation successful.</span>
                                                                ) : (
                                                                    log.changedFields?.map((field: string) => {
                                                                        const formatVal = (val: any) => {
                                                                            if (val === null || val === undefined) return 'None';
                                                                            if (typeof val === 'object') return 'Complex Object';
                                                                            const str = String(val);
                                                                            if (str.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)) {
                                                                                return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                                                                            }
                                                                            return str;
                                                                        };

                                                                        return (
                                                                            <div key={field} className="flex items-center gap-4 text-xs font-bold">
                                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg leading-none min-w-[120px] text-center">
                                                                                    {field.replace(/([A-Z])/g, ' $1')}
                                                                                </span>
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className="text-slate-400 line-through truncate max-w-[150px]">{formatVal(log.previousData?.[field])}</span>
                                                                                    <ArrowRight className="h-3 w-3 text-slate-300" />
                                                                                    <span className="text-slate-900 truncate max-w-[200px]">{formatVal(log.newData?.[field])}</span>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })
                                                                )}
                                                            </div>
                                                        </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr><td colSpan={3} className="px-8 py-12 text-center text-xs font-black text-slate-300 uppercase tracking-widest">No audit logs available for this record.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-100 px-12">
                <Button type="button" variant="outline" onClick={onCancel} className="h-14 px-8 rounded-2xl border-2 border-slate-100 font-extrabold text-rose-500 uppercase tracking-widest hover:bg-rose-50 hover:text-rose-700 transition-all flex items-center gap-2 bg-white shadow-sm">
                    <X className="h-5 w-5" /> Cancel & Discard
                </Button>

                <div className="flex items-center gap-4">
                    {currentStep > 1 && (
                        <Button type="button" variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} className="h-14 px-10 rounded-2xl border-2 border-slate-100 font-extrabold text-slate-600 uppercase tracking-widest hover:bg-slate-50 hover:text-slate-900 transition-all bg-white shadow-sm">
                            <ArrowLeft className="h-5 w-5 mr-3" /> Go Back
                        </Button>
                    )}

                    {currentStep < 3 ? (
                        <Button type="button" onClick={() => setCurrentStep(prev => prev + 1)} className="h-14 px-14 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold uppercase tracking-widest shadow-xl shadow-cyan-100 transition-all active:scale-95 flex items-center gap-3">
                            Next Stage <ArrowRight className="h-5 w-5" />
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            className="h-14 px-16 rounded-2xl bg-slate-900 hover:bg-black text-white font-extrabold uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3"
                        >
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            {isEditing ? 'Confirm Updates' : 'Issue Invoice'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
