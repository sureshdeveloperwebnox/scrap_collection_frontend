'use client';

import { useState, useEffect, useMemo } from 'react';
import { useScrapYards, useDeleteScrapYard, useUpdateScrapYard } from '@/hooks/use-scrap-yards';
import { ScrapYard } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Building2, Users, Plus, Edit, Trash2, MoreVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';
import { MapDialog } from '@/components/map-dialog';
import { ScrapYardForm } from '@/components/scrap-yard-form';

interface ApiResponse {
  data: {
    scrapYards: ScrapYard[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage?: boolean;
      hasPreviousPage?: boolean;
    };
  };
}

export default function ScrapYardsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    title: string;
    address?: string;
  } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScrapYard, setEditingScrapYard] = useState<ScrapYard | undefined>();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch scrap yards
  const { data: scrapYardsData, isLoading, error, refetch } = useScrapYards({
    page,
    limit,
    search: debouncedSearchTerm || undefined,
  });

  const deleteScrapYardMutation = useDeleteScrapYard();
  const updateScrapYardMutation = useUpdateScrapYard();

  // Handle API response structure
  const apiResponse = scrapYardsData as unknown as ApiResponse;
  const scrapYards = useMemo(() => apiResponse?.data?.scrapYards || [], [apiResponse]) as ScrapYard[];
  const pagination = useMemo(() => apiResponse?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  }, [apiResponse]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this scrap yard?')) {
      try {
        await deleteScrapYardMutation.mutateAsync(id);
        toast.success('Scrap yard deleted successfully');
      } catch (error) {
        toast.error('Failed to delete scrap yard');
      }
    }
  };

  const handleLocationClick = (yard: ScrapYard) => {
    // Fix: Check if coordinates are valid (not 0 or undefined)
    if (yard.latitude && yard.longitude && 
        yard.latitude !== 0 && yard.longitude !== 0) {
      setSelectedLocation({
        latitude: yard.latitude,
        longitude: yard.longitude,
        title: yard.yardName,
        address: yard.address,
      });
    } else {
      toast.error('Location coordinates are not set for this scrap yard');
    }
  };

  const getManager = (yard: ScrapYard) => {
    if (yard.employees && yard.employees.length > 0) {
      // Find manager/supervisor or return first employee
      const manager = yard.employees.find(
        (emp) => emp.role?.name?.toUpperCase().includes('MANAGER') || 
                 emp.role?.name?.toUpperCase().includes('SUPERVISOR')
      );
      return manager || yard.employees[0];
    }
    return null;
  };

  const getStatus = (yard: ScrapYard) => {
    return yard.isActive !== false ? 'Active' : 'Inactive';
  };

  const handleToggleStatus = async (yard: ScrapYard) => {
    try {
      const newStatus = !yard.isActive;
      await updateScrapYardMutation.mutateAsync({
        id: yard.id,
        data: { isActive: newStatus }
      });
      toast.success(`Scrap yard ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update scrap yard status');
    }
  };

  const handleCreate = () => {
    setEditingScrapYard(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (yard: ScrapYard) => {
    setEditingScrapYard(yard);
    setIsFormOpen(true);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading scrap yards</h2>
          <p className="text-gray-600 mt-2">Please try again later.</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  const totalYards = pagination.total;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scrap Yards</h2>
          <p className="text-gray-600 mt-1">
            {isLoading ? 'Loading...' : `${totalYards} Total Scrap Yards`}
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Scrap Yard
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search scrap yards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Scrap Yards</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : scrapYards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No scrap yards found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Scrap Yard Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scrapYards.map((yard) => {
                      const manager = getManager(yard);
                      const status = getStatus(yard);
                      
                      return (
                        <TableRow key={yard.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4 text-blue-500" />
                              <span>{yard.yardName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {yard.latitude && yard.longitude && 
                             yard.latitude !== 0 && yard.longitude !== 0 ? (
                              <button
                                onClick={() => handleLocationClick(yard)}
                                className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              >
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>View on Map</span>
                              </button>
                            ) : (
                              <span className="text-gray-400 text-sm">Not set</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {manager ? (
                              <div className="flex items-center">
                                <Users className="h-3 w-3 mr-1 text-gray-400" />
                                <span className="text-sm">{manager.fullName}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">No manager assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={yard.isActive !== false}
                                onCheckedChange={() => handleToggleStatus(yard)}
                                disabled={updateScrapYardMutation.isPending}
                              />
                              <span className="text-sm text-gray-600">
                                {status}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(yard)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(yard.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <RowsPerPage
                  value={limit}
                  onChange={(value) => {
                    setLimit(value);
                    setPage(1);
                  }}
                  options={[5, 10, 20, 50]}
                />
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} scrap yards
                </div>
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(page) => setPage(page)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Map Dialog */}
      {selectedLocation && (
        <MapDialog
          isOpen={!!selectedLocation}
          onClose={() => setSelectedLocation(null)}
          latitude={selectedLocation.latitude}
          longitude={selectedLocation.longitude}
          title={selectedLocation.title}
          address={selectedLocation.address}
        />
      )}

      {/* Form Dialog */}
      <ScrapYardForm
        scrapYard={editingScrapYard}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingScrapYard(undefined);
        }}
      />
    </div>
  );
}
