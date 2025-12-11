'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrapYard } from '@/types';
import { Search, MapPin, Building2, Users, Truck, AlertCircle } from 'lucide-react';

const mockScrapYards: ScrapYard[] = [
  {
    id: 'yard-1',
    name: 'Sydney Scrap Yard',
    address: '123 Industrial St, Sydney',
    city: 'Sydney',
    state: 'NSW',
    capacity: 1000,
    currentLoad: 750,
    managerId: 'manager-1',
    status: 'active',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'yard-2',
    name: 'Melbourne Scrap Yard',
    address: '456 Factory Rd, Melbourne',
    city: 'Melbourne',
    state: 'VIC',
    capacity: 1200,
    currentLoad: 400,
    managerId: 'manager-2',
    status: 'active',
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: 'yard-3',
    name: 'Brisbane Scrap Yard',
    address: '789 Warehouse Ave, Brisbane',
    city: 'Brisbane',
    state: 'QLD',
    capacity: 800,
    currentLoad: 200,
    managerId: 'manager-3',
    status: 'active',
    createdAt: new Date('2023-03-10'),
    updatedAt: new Date('2024-01-13'),
  },
  {
    id: 'yard-4',
    name: 'Perth Scrap Yard',
    address: '321 Commerce St, Perth',
    city: 'Perth',
    state: 'WA',
    capacity: 600,
    currentLoad: 580,
    managerId: 'manager-4',
    status: 'active',
    createdAt: new Date('2023-04-05'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: 'yard-5',
    name: 'Adelaide Scrap Yard',
    address: '654 Storage Blvd, Adelaide',
    city: 'Adelaide',
    state: 'SA',
    capacity: 500,
    currentLoad: 100,
    managerId: 'manager-5',
    status: 'maintenance',
    createdAt: new Date('2023-05-20'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: 'yard-6',
    name: 'Darwin Scrap Yard',
    address: '987 Port Rd, Darwin',
    city: 'Darwin',
    state: 'NT',
    capacity: 400,
    currentLoad: 150,
    managerId: 'manager-6',
    status: 'active',
    createdAt: new Date('2023-06-15'),
    updatedAt: new Date('2024-01-11'),
  },
];

export default function ScrapYardsPage() {
  const [scrapYards, setScrapYards] = useState<ScrapYard[]>(mockScrapYards);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredYards = scrapYards.filter(yard =>
    yard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    yard.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    yard.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-orange-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCapacityPercentage = (currentLoad: number, capacity: number) => {
    return Math.round((currentLoad / capacity) * 100);
  };

  const totalCapacity = scrapYards.reduce((sum, yard) => sum + yard.capacity, 0);
  const totalCurrentLoad = scrapYards.reduce((sum, yard) => sum + yard.currentLoad, 0);
  const activeYards = scrapYards.filter(yard => yard.status === 'active').length;
  const nearCapacityYards = scrapYards.filter(yard => 
    getCapacityPercentage(yard.currentLoad, yard.capacity) >= 90
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Scrap Yard Management</h1>
        <div className="text-sm text-gray-500">
          Monitor capacity and manage scrap yard operations
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Yards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeYards}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">{totalCapacity.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">{totalCurrentLoad.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Near Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{nearCapacityYards}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Scrap Yards</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search scrap yards..."
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
                <TableHead>Yard Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Current Load</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredYards.map((yard) => {
                const utilization = getCapacityPercentage(yard.currentLoad, yard.capacity);
                const utilizationColor = getCapacityColor(utilization);
                
                return (
                  <TableRow key={yard.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <Building2 className="h-4 w-4 text-blue-500" />
                        <span>{yard.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                        <div>
                          <div>{yard.city}, {yard.state}</div>
                          <div className="text-gray-500 text-xs">{yard.address}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1 text-gray-400" />
                        {yard.managerId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Truck className="h-3 w-3 mr-1 text-gray-400" />
                        {yard.capacity.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>{yard.currentLoad.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              utilization >= 90 ? 'bg-red-600' :
                              utilization >= 75 ? 'bg-orange-600' :
                              utilization >= 50 ? 'bg-yellow-600' : 'bg-green-600'
                            }`}
                            style={{ width: `${utilization}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${utilizationColor}`}>
                          {utilization}%
                        </span>
                        {utilization >= 90 && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(yard.status)}`}>
                        {yard.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
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