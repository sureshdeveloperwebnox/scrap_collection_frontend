'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrderForm } from '@/components/order-form';
import { Order } from '@/types';
import { Plus, Search, Edit2, Trash2, MapPin, User } from 'lucide-react';

const mockOrders: Order[] = [
  {
    id: '1',
    leadId: 'lead-1',
    customerId: 'customer-1',
    collectorId: 'collector-1',
    scrapYardId: 'yard-1',
    vehicleType: 'car',
    scrapType: 'junk',
    pickupAddress: '123 Main St, Sydney, NSW',
    status: 'pending',
    scheduledDate: new Date('2024-01-20'),
    estimatedValue: 500,
    notes: 'Customer prefers morning pickup',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    leadId: 'lead-2',
    customerId: 'customer-2',
    collectorId: 'collector-2',
    scrapYardId: 'yard-2',
    vehicleType: 'truck',
    scrapType: 'accident-damaged',
    pickupAddress: '456 Oak Ave, Melbourne, VIC',
    status: 'assigned',
    scheduledDate: new Date('2024-01-18'),
    estimatedValue: 1200,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: '3',
    leadId: 'lead-3',
    customerId: 'customer-3',
    collectorId: 'collector-1',
    scrapYardId: 'yard-3',
    vehicleType: 'bike',
    scrapType: 'fully-scrap',
    pickupAddress: '789 Pine Rd, Brisbane, QLD',
    status: 'in-progress',
    scheduledDate: new Date('2024-01-17'),
    estimatedValue: 200,
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-17'),
  },
  {
    id: '4',
    leadId: 'lead-4',
    customerId: 'customer-4',
    collectorId: 'collector-3',
    scrapYardId: 'yard-1',
    vehicleType: 'car',
    scrapType: 'junk',
    pickupAddress: '321 Elm St, Perth, WA',
    status: 'completed',
    scheduledDate: new Date('2024-01-12'),
    completedDate: new Date('2024-01-12'),
    estimatedValue: 600,
    finalValue: 650,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-12'),
  },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | undefined>();

  const filteredOrders = orders.filter(order =>
    order.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateOrder = (orderData: Partial<Order>) => {
    const newOrder: Order = {
      ...orderData as Order,
      id: Date.now().toString(),
      leadId: `lead-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setOrders([...orders, newOrder]);
  };

  const handleUpdateOrder = (orderData: Partial<Order>) => {
    setOrders(orders.map(order => 
      order.id === editingOrder?.id 
        ? { ...order, ...orderData, updatedAt: new Date() }
        : order
    ));
    setEditingOrder(undefined);
  };

  const handleDeleteOrder = (id: string) => {
    if (confirm('Are you sure you want to delete this order?')) {
      setOrders(orders.filter(order => order.id !== id));
    }
  };

  const handleAssignCollector = (orderId: string) => {
    const collectorIds = ['collector-1', 'collector-2', 'collector-3', 'collector-4'];
    const randomCollector = collectorIds[Math.floor(Math.random() * collectorIds.length)];
    
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, collectorId: randomCollector, status: 'assigned', updatedAt: new Date() }
        : order
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assigned Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">
              {orders.filter(o => o.status === 'assigned').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {orders.filter(o => o.status === 'in-progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search orders..."
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
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Pickup Address</TableHead>
                <TableHead>Collector</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>{order.customerId}</TableCell>
                  <TableCell className="capitalize">
                    {order.vehicleType} ({order.scrapType.replace('-', ' ')})
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="mr-1 h-3 w-3 text-gray-400" />
                      <span className="truncate max-w-[200px]">{order.pickupAddress}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.collectorId ? (
                      <div className="flex items-center">
                        <User className="mr-1 h-3 w-3 text-gray-400" />
                        {order.collectorId}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAssignCollector(order.id)}
                      >
                        Auto Assign
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(order.status)}`}>
                      {order.status.replace('-', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">${order.estimatedValue}</div>
                      {order.finalValue && (
                        <div className="text-sm text-green-600">Final: ${order.finalValue}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingOrder(order);
                          setIsFormOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <OrderForm
        order={editingOrder}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingOrder(undefined);
        }}
        onSubmit={editingOrder ? handleUpdateOrder : handleCreateOrder}
      />
    </div>
  );
}