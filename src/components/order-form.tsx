'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Order, VehicleType, ScrapType, OrderStatus } from '@/types';

interface OrderFormProps {
  order?: Order;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (order: Partial<Order>) => void;
}

export function OrderForm({ order, isOpen, onClose, onSubmit }: OrderFormProps) {
  const [formData, setFormData] = useState<Partial<Order>>({
    customerId: order?.customerId || '',
    collectorId: order?.collectorId || '',
    scrapYardId: order?.scrapYardId || '',
    vehicleType: order?.vehicleType || 'car',
    scrapType: order?.scrapType || 'junk',
    pickupAddress: order?.pickupAddress || '',
    status: order?.status || 'pending',
    estimatedValue: order?.estimatedValue || 0,
    notes: order?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleInputChange = (field: keyof Order, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{order ? 'Edit Order' : 'Create New Order'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer ID</Label>
              <Input
                id="customerId"
                value={formData.customerId}
                onChange={(e) => handleInputChange('customerId', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collectorId">Collector ID</Label>
              <Input
                id="collectorId"
                value={formData.collectorId || ''}
                onChange={(e) => handleInputChange('collectorId', e.target.value)}
                placeholder="Auto-assign if empty"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scrapYardId">Scrap Yard ID</Label>
            <Select value={formData.scrapYardId} onValueChange={(value) => handleInputChange('scrapYardId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select scrap yard" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yard-1">Sydney Scrap Yard</SelectItem>
                <SelectItem value="yard-2">Melbourne Scrap Yard</SelectItem>
                <SelectItem value="yard-3">Brisbane Scrap Yard</SelectItem>
                <SelectItem value="yard-4">Perth Scrap Yard</SelectItem>
                <SelectItem value="yard-5">Adelaide Scrap Yard</SelectItem>
                <SelectItem value="yard-6">Darwin Scrap Yard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Select value={formData.vehicleType} onValueChange={(value) => handleInputChange('vehicleType', value as VehicleType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="boat">Boat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="scrapType">Scrap Type</Label>
              <Select value={formData.scrapType} onValueChange={(value) => handleInputChange('scrapType', value as ScrapType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scrap type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junk">Junk</SelectItem>
                  <SelectItem value="accident-damaged">Accident Damaged</SelectItem>
                  <SelectItem value="fully-scrap">Fully Scrap</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickupAddress">Pickup Address</Label>
            <Input
              id="pickupAddress"
              value={formData.pickupAddress}
              onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value as OrderStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
              <Input
                id="estimatedValue"
                type="number"
                min="0"
                step="0.01"
                value={formData.estimatedValue}
                onChange={(e) => handleInputChange('estimatedValue', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {order ? 'Update Order' : 'Create Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}