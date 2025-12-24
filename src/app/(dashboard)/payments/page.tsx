'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Payment, PaymentStatusEnum, PaymentTypeEnum } from '@/types';
import { Search, CreditCard, DollarSign, AlertCircle, CheckCircle, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { usePayments, useProcessRefund } from '@/hooks/use-payments';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/ui/table-skeleton';

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; payment: Payment | null }>({ open: false, payment: null });
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const { data: paymentsData, isLoading } = usePayments({
    search: searchTerm || undefined,
    status: statusFilter !== 'ALL' ? statusFilter as PaymentStatusEnum : undefined,
  });
  const refundMutation = useProcessRefund();

  const payments = paymentsData?.data?.payments || [];

  const filteredPayments = payments.filter(payment =>
    payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.customerId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefund = async () => {
    if (!refundDialog.payment) return;

    try {
      await refundMutation.mutateAsync({
        paymentId: refundDialog.payment.id,
        amount: refundAmount ? parseFloat(refundAmount) : undefined,
        reason: refundReason || undefined,
      });
      toast.success('Refund processed successfully');
      setRefundDialog({ open: false, payment: null });
      setRefundAmount('');
      setRefundReason('');
    } catch (error) {
      toast.error('Failed to process refund');
    }
  };

  const getStatusColor = (status: PaymentStatusEnum) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'UNPAID': return 'bg-yellow-100 text-yellow-800';
      case 'REFUNDED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: PaymentStatusEnum) => {
    switch (status) {
      case 'PAID': return CheckCircle;
      case 'UNPAID': return Clock;
      case 'REFUNDED': return RefreshCw;
      default: return Clock;
    }
  };

  const getMethodIcon = (method: PaymentTypeEnum) => {
    switch (method) {
      case 'CARD': return CreditCard;
      case 'CASH': return DollarSign;
      case 'BANK_TRANSFER': return CreditCard;
      case 'ONLINE': return CreditCard;
      default: return CreditCard;
    }
  };

  const totalRevenue = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  const unpaidAmount = payments
    .filter(p => p.status === 'UNPAID')
    .reduce((sum, p) => sum + p.amount, 0);

  const refundedAmount = payments
    .filter(p => p.status === 'REFUNDED')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <div className="text-sm text-gray-500">
          Track payments and transactions
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalRevenue.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${unpaidAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Refunded Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">
              ${refundedAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton columnCount={9} rowCount={10} />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No payments found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Collector</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const StatusIcon = getStatusIcon(payment.status);
                  const MethodIcon = getMethodIcon(payment.paymentType);

                  return (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">#{payment.id.slice(0, 8)}</TableCell>
                      <TableCell>#{payment.orderId.slice(0, 8)}</TableCell>
                      <TableCell>{payment.customerId.slice(0, 8)}</TableCell>
                      <TableCell>{payment.collectorId ? payment.collectorId.slice(0, 8) : 'N/A'}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          ${payment.amount.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <MethodIcon className="h-4 w-4 text-gray-500" />
                          <span className="capitalize">
                            {payment.paymentType.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <StatusIcon className="h-4 w-4" />
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(payment.status)}`}>
                            {payment.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {payment.status === 'PAID' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRefundDialog({ open: true, payment })}
                            >
                              Refund
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Refund Dialog */}
      <Dialog open={refundDialog.open} onOpenChange={(open) => !open && setRefundDialog({ open: false, payment: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {refundDialog.payment && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Payment Amount</label>
                  <div className="text-lg font-bold">${refundDialog.payment.amount.toLocaleString()}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Refund Amount *</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max={refundDialog.payment.amount}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder={`Max: $${refundDialog.payment.amount}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Reason</label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md resize-none"
                    placeholder="Enter refund reason..."
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialog({ open: false, payment: null })}>
              Cancel
            </Button>
            <Button
              onClick={handleRefund}
              disabled={refundMutation.isPending || !refundAmount}
            >
              {refundMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Process Refund'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
