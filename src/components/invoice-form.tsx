'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    Search
} from 'lucide-react';

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
    terms?: string;
}

interface InvoiceFormProps {
    prefillWorkOrderId?: string | null;
    initialData?: any;
    onSubmit: (data: InvoiceFormData) => void;
    onCancel: () => void;
}

export function InvoiceForm({ prefillWorkOrderId, initialData, onSubmit, onCancel }: InvoiceFormProps) {
    const isEditing = !!initialData;

    // Fetch history if editing
    const { data: historyRes, isLoading: isLoadingHistory } = useInvoiceHistory(initialData?.id || null);
    const history = historyRes?.data || [];

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
    const [terms, setTerms] = useState(initialData?.terms || '');

    // Fetch customers
    const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({ limit: 100 });
    const customers = customersData?.data?.customers || [];

    // Fetch all orders for current customer
    const { data: ordersData, isLoading: isLoadingOrders } = useOrders({
        customerId: customerId || undefined,
        limit: 100,
        organizationId: undefined // Let hook handle it
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
                    unitPrice: prefilledOrder.quotedPrice || 0,
                    amount: prefilledOrder.quotedPrice || 0
                }]);
            }
        }
    }, [prefilledOrder, initialData]);

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount - discount;

    // Handle item changes
    const handleItemChange = (index: number, field: keyof LineItem, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Recalculate amount
        if (field === 'quantity' || field === 'unitPrice') {
            newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
        }

        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!customerId) {
            toast.error('Please select a customer');
            return;
        }

        if (!invoiceNumber) {
            toast.error('Please enter an invoice number');
            return;
        }

        if (items.some(item => !item.description)) {
            toast.error('Please fill in all item descriptions');
            return;
        }

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
            total,
            notes: notes || undefined,
            terms: terms || undefined
        };

        onSubmit(formData);
    };

    if (isLoadingPrefilledOrder) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-gray-500 font-medium">Loading work order details...</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black text-slate-900">
                    {isEditing ? 'Edit Invoice' : 'Create New Invoice'}
                </h2>
                {isEditing && (
                    <Badge className="bg-blue-100 text-blue-700 border-none font-bold">
                        Editing: {initialData.invoiceNumber}
                    </Badge>
                )}
            </div>

            {/* Header Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <Card className="border-2 border-blue-100/50 rounded-[24px] shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                            <User className="h-4 w-4 text-blue-600" />
                            Customer Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div>
                            <Label htmlFor="customerId" className="text-xs font-bold text-slate-500 uppercase">Customer *</Label>
                            <Select value={customerId} onValueChange={setCustomerId}>
                                <SelectTrigger className="mt-1.5 h-11 rounded-xl border-slate-200">
                                    <SelectValue placeholder={isLoadingCustomers ? "Loading customers..." : "Select customer"} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                    {customers.map((customer: any) => (
                                        <SelectItem key={customer.id} value={customer.id} className="rounded-lg">
                                            <div className="flex flex-col py-0.5">
                                                <span className="font-bold">{customer.name}</span>
                                                <span className="text-[10px] text-slate-400 font-medium tracking-tight">{customer.phone}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="workOrderId" className="text-xs font-bold text-slate-500 uppercase">Work Order (Optional)</Label>
                            <Select
                                value={workOrderId || 'none'}
                                onValueChange={setWorkOrderId}
                                disabled={!customerId}
                            >
                                <SelectTrigger className="mt-1.5 h-11 rounded-xl border-slate-200">
                                    <SelectValue placeholder={
                                        !customerId
                                            ? "Select customer first"
                                            : isLoadingOrders
                                                ? "Loading orders..."
                                                : "Select work order"
                                    } />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-none shadow-2xl">
                                    <SelectItem value="none" className="rounded-lg">None</SelectItem>
                                    {orders.map((order: any) => (
                                        <SelectItem key={order.id} value={order.id} className="rounded-lg">
                                            <span className="font-bold">{order.orderNumber || order.id.substring(0, 8)}</span>
                                            <span className="ml-2 text-[10px] uppercase font-black tracking-widest text-slate-400">{order.orderStatus}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {!customerId && (
                                <p className="text-[10px] text-slate-400 mt-2 italic font-medium">
                                    Select a customer to see their work orders
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Invoice Details */}
                <Card className="border-2 border-slate-100 rounded-[24px] shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                            <FileText className="h-4 w-4 text-slate-600" />
                            Invoice Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                        <div>
                            <Label htmlFor="invoiceNumber" className="text-xs font-bold text-slate-500 uppercase">Invoice Number *</Label>
                            <Input
                                id="invoiceNumber"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                className="mt-1.5 h-11 rounded-xl border-slate-200 font-bold"
                                placeholder="INV-001"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="invoiceDate" className="text-xs font-bold text-slate-500 uppercase">Issue Date *</Label>
                                <Input
                                    id="invoiceDate"
                                    type="date"
                                    value={invoiceDate}
                                    onChange={(e) => setInvoiceDate(e.target.value)}
                                    className="mt-1.5 h-11 rounded-xl border-slate-200 font-bold"
                                />
                            </div>

                            <div>
                                <Label htmlFor="dueDate" className="text-xs font-bold text-slate-500 uppercase">Due Date *</Label>
                                <Input
                                    id="dueDate"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="mt-1.5 h-11 rounded-xl border-slate-200 font-bold"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Line Items */}
            <Card className="border-2 border-slate-100 rounded-[32px] shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 px-8 py-6">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                            <DollarSign className="h-4 w-4 text-emerald-600" />
                            Service Items
                        </CardTitle>
                        <Button type="button" onClick={addItem} size="sm" className="rounded-xl font-bold bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm border h-9 px-4">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Item
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 items-start p-6 bg-slate-50/50 border border-slate-100 rounded-[24px] relative group/item">
                                <div className="col-span-12 md:col-span-5">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Description *</Label>
                                    <Input
                                        value={item.description}
                                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                        placeholder="Item description"
                                        className="mt-1.5 h-11 rounded-xl border-slate-200 bg-white font-bold"
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Qty *</Label>
                                    <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                        min="1"
                                        className="mt-1.5 h-11 rounded-xl border-slate-200 bg-white font-bold text-center"
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Rate *</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                                        <Input
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                            min="0"
                                            step="0.01"
                                            className="mt-1.5 h-11 rounded-xl border-slate-200 bg-white font-bold pl-7"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-3 md:col-span-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total</Label>
                                    <div className="mt-1.5 h-11 rounded-xl bg-slate-100 flex items-center px-4 font-black text-slate-900 border border-slate-200">
                                        ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                <div className="col-span-1 flex items-end h-full pt-6">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeItem(index)}
                                        disabled={items.length === 1}
                                        className="h-11 w-11 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totals Section */}
                    <div className="mt-12 flex flex-col md:flex-row gap-8 items-start">
                        <div className="flex-1 space-y-6 w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-medium">
                                <div>
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Notes</Label>
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Internal notes or special instructions..."
                                        className="mt-1.5 rounded-2xl border-slate-200 min-h-[120px] bg-slate-50/30"
                                    />
                                </div>
                                <div>
                                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Terms</Label>
                                    <Textarea
                                        value={terms}
                                        onChange={(e) => setTerms(e.target.value)}
                                        placeholder="Payment terms, bank details, etc..."
                                        className="mt-1.5 rounded-2xl border-slate-200 min-h-[120px] bg-slate-50/30"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-[350px] bg-slate-900 text-white p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl opacity-50" />
                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-center text-slate-400">
                                    <span className="text-xs font-bold uppercase tracking-wider">Subtotal</span>
                                    <span className="text-sm font-black">${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>

                                <div className="flex justify-between items-center group">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Tax</span>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={taxRate}
                                                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                                className="w-12 h-6 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black text-center text-blue-300 outline-none"
                                            />
                                            <span className="absolute -right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-400">%</span>
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-blue-400">+ ${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Discount</span>
                                        <div className="relative">
                                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-rose-400">$</span>
                                            <input
                                                type="number"
                                                value={discount}
                                                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                                className="w-20 h-6 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[10px] font-black pl-4 text-rose-300 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-rose-400">- ${discount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>

                                <div className="pt-6 border-t border-white/10 mt-6">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Grand Total Due</p>
                                            <span className="text-3xl font-black text-white">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Log / Edit History Section */}
            {isEditing && (
                <div className="mt-12 space-y-4">
                    <div className="flex items-center gap-2 px-1">
                        <History className="h-4 w-4 text-blue-600" />
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Amendment History</h3>
                    </div>

                    <div className="border border-slate-200 rounded-[24px] overflow-hidden bg-white shadow-sm">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100/80">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left w-[20%]">Date & Time</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[15%]">Action</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Description of Changes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoadingHistory ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center">
                                            <Loader2 className="h-6 w-6 text-blue-500 animate-spin mx-auto" />
                                        </td>
                                    </tr>
                                ) : history.length > 0 ? (
                                    history.map((log: any) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 align-top">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-800">
                                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400">
                                                        {new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top text-center">
                                                <Badge className={cn(
                                                    "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border-none",
                                                    log.action === 'CREATED' ? "bg-emerald-100 text-emerald-700" :
                                                        log.action === 'STATUS_CHANGE' ? "bg-amber-100 text-amber-700" :
                                                            "bg-blue-100 text-blue-700"
                                                )}>
                                                    {log.action.replace('_', ' ')}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="space-y-2">
                                                    {log.action === 'CREATED' ? (
                                                        <span className="text-xs font-bold text-slate-500 italic">Invoice initial state created</span>
                                                    ) : (
                                                        log.changedFields?.map((field: string) => (
                                                            <div key={field} className="flex items-center gap-3 text-xs">
                                                                <span className="font-black text-slate-400 uppercase text-[9px] bg-slate-100 px-1.5 py-0.5 rounded leading-none min-w-[80px] text-center">
                                                                    {field.replace(/([A-Z])/g, ' $1')}
                                                                </span>
                                                                <div className="flex items-center gap-2 flex-grow">
                                                                    <span className="text-slate-400 line-through font-medium truncate max-w-[150px]">
                                                                        {typeof log.previousData?.[field] === 'object' ? 'Items' : String(log.previousData?.[field] || 'None')}
                                                                    </span>
                                                                    <ArrowRight className="h-3 w-3 text-slate-300" />
                                                                    <span className="text-slate-900 font-black truncate max-w-[200px]">
                                                                        {typeof log.newData?.[field] === 'object' ? 'Items Updated' : String(log.newData?.[field] || 'None')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center">
                                            <p className="text-xs font-bold text-slate-400">No modification records found.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-8">
                <Button type="button" variant="ghost" onClick={onCancel} className="rounded-2xl font-bold h-12 px-8 text-slate-500 hover:bg-slate-100">
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="rounded-2xl h-12 px-10 font-black text-sm uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 transition-all active:scale-95"
                >
                    {isEditing ? 'Update Invoice' : 'Create Invoice'}
                </Button>
            </div>
        </form>
    );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={cn("px-2 py-1 rounded text-xs font-medium", className)}>
            {children}
        </span>
    );
}
