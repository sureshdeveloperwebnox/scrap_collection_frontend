'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collector } from '@/types';
import { Search, MapPin, Star, Truck, Phone, Mail } from 'lucide-react';

const mockCollectors: Collector[] = [
  {
    id: '1',
    name: 'Tom Collector',
    email: 'tom@scrap.com',
    phone: '+61 400 100 200',
    role: 'collector',
    status: 'active',
    workZone: 'Sydney Metro',
    vehicleDetails: 'Toyota Hiace - ABC123',
    totalPickups: 145,
    averageRating: 4.8,
    currentLocation: { lat: -33.8688, lng: 151.2093 },
    createdAt: new Date('2023-08-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Lisa Driver',
    email: 'lisa@scrap.com',
    phone: '+61 400 300 400',
    role: 'collector',
    status: 'active',
    workZone: 'Melbourne',
    vehicleDetails: 'Ford Transit - DEF456',
    totalPickups: 98,
    averageRating: 4.6,
    currentLocation: { lat: -37.8136, lng: 144.9631 },
    createdAt: new Date('2023-09-15'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: '3',
    name: 'Mark Handler',
    email: 'mark@scrap.com',
    phone: '+61 400 500 600',
    role: 'collector',
    status: 'active',
    workZone: 'Brisbane',
    vehicleDetails: 'Isuzu NPR - GHI789',
    totalPickups: 67,
    averageRating: 4.9,
    currentLocation: { lat: -27.4698, lng: 153.0251 },
    createdAt: new Date('2023-11-01'),
    updatedAt: new Date('2024-01-13'),
  },
  {
    id: '4',
    name: 'Sam Pickup',
    email: 'sam@scrap.com',
    phone: '+61 400 700 800',
    role: 'collector',
    status: 'inactive',
    workZone: 'Perth',
    vehicleDetails: 'Mitsubishi Canter - JKL012',
    totalPickups: 203,
    averageRating: 4.7,
    createdAt: new Date('2023-06-01'),
    updatedAt: new Date('2024-01-05'),
  },
];

export default function CollectorsPage() {
  const [collectors, setCollectors] = useState<Collector[]>(mockCollectors);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCollectors = collectors.filter(collector =>
    collector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collector.workZone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collector.vehicleDetails?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const activeCollectors = collectors.filter(c => c.status === 'active').length;
  const totalPickups = collectors.reduce((sum, c) => sum + c.totalPickups, 0);
  const averageRating = collectors.reduce((sum, c) => sum + c.averageRating, 0) / collectors.length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Collector Management</h1>
        <div className="text-sm text-gray-500">
          Track collector performance and assignments
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Collectors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCollectors}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Pickups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{totalPickups}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{averageRating.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {collectors.sort((a, b) => b.averageRating - a.averageRating)[0]?.name || 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Collectors</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search collectors..."
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
                <TableHead>Collector</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Work Zone</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCollectors.map((collector) => (
                <TableRow key={collector.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Truck className="h-4 w-4 text-blue-500" />
                      <span>{collector.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1 text-gray-400" />
                        {collector.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-3 w-3 mr-1 text-gray-400" />
                        {collector.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                      {collector.workZone}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {collector.vehicleDetails || 'Not specified'}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{collector.totalPickups} pickups</div>
                      <div className="text-gray-500">Total completed</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <div className="flex">{renderStars(collector.averageRating)}</div>
                      <span className="text-sm font-medium ml-1">
                        {collector.averageRating.toFixed(1)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(collector.status)}`}>
                      {collector.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {collector.currentLocation ? (
                      <div className="text-xs text-gray-500">
                        <div>Lat: {collector.currentLocation.lat.toFixed(4)}</div>
                        <div>Lng: {collector.currentLocation.lng.toFixed(4)}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Unknown</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}