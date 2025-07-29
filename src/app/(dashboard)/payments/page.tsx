'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Payment } from '@/types';
import { Search, CreditCard, DollarSign, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

const mockPayments: Payment[] = [
  {
    id: 'pay-1',
    orderId: 'order-1',
    customerId: 'customer-1',
    amount: 650,
    status: 'completed',
    method: 'card',
    transactionId: 'txn_1234567890',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'pay-2',
    orderId: 'order-2',
    customerId: 'customer-2',
    amount: 1200,
    status: 'pending',
    method: 'bank-transfer',
    transactionId: 'txn_2345678901',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: 'pay-3',
    orderId: 'order-3',
    customerId: 'customer-3',
    amount: 200,
    status: 'completed',
    method: 'cash',
    transactionId: 'txn_3456789012',
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
  {
    id: 'pay-4',
    orderId: 'order-4',
    customerId: 'customer-4',
    amount: 500,
    status: 'failed',
    method: 'card',
    transactionId: 'txn_4567890123',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: 'pay-5',
    orderId: 'order-5',
    customerId: 'customer-5',
    amount: 300,
    status: 'refunded',
    method: 'wallet',
    transactionId: 'txn_5678901234',
    refundId: 'ref_1234567890',
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-12'),
  },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayments = payments.filter(payment =>
    payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'pending': return Clock;
      case 'failed': return AlertCircle;
      case 'refunded': return RefreshCw;
      default: return Clock;
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return CreditCard;
      case 'cash': return DollarSign;
      case 'bank-transfer': return CreditCard;
      case 'wallet': return DollarSign;
      default: return CreditCard;
    }
  };

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const failedCount = payments.filter(p => p.status === 'failed').length;
  const refundedAmount = payments
    .filter(p => p.status === 'refunded')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <div className="text-sm text-gray-500">
          Track payments and transactions
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${pendingAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Refunded Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${refundedAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment ID</TableHead>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => {
                const StatusIcon = getStatusIcon(payment.status);
                const MethodIcon = getMethodIcon(payment.method);
                
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">#{payment.id}</TableCell>
                    <TableCell>#{payment.orderId}</TableCell>
                    <TableCell>{payment.customerId}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        ${payment.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MethodIcon className="h-4 w-4 text-gray-500" />
                        <span className="capitalize">
                          {payment.method.replace('-', ' ')}
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
                    <TableCell className="font-mono text-sm">
                      {payment.transactionId}
                      {payment.refundId && (
                        <div className="text-xs text-blue-600">
                          Refund: {payment.refundId}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{payment.createdAt.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {payment.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            Refund
                          </Button>
                        )}
                        {payment.status === 'failed' && (
                          <Button variant="outline" size="sm">
                            Retry
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}