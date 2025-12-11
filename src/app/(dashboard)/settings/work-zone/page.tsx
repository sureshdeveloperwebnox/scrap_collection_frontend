'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCities, useDeleteCity, useUpdateCity } from '@/hooks/use-cities';
import { City } from '@/lib/api/cities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CityForm } from '@/components/city-form';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

type SortKey = 'name' | 'isActive' | 'updatedAt';

interface ApiResponse {
  data: {
    cities: City[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export default function WorkZonePage() {
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch cities
  const { data: citiesData, isLoading, error, refetch } = useCities({
    page,
    limit,
    search: debouncedSearchTerm || undefined,
    status: isActiveFilter,
    sortBy,
    sortOrder,
  });

  // Mutations
  const deleteCityMutation = useDeleteCity();
  const updateCityMutation = useUpdateCity();

  // Handle API response structure
  const apiResponse = citiesData as unknown as ApiResponse;
  const cities = useMemo(() => apiResponse?.data?.cities || [], [apiResponse]);
  const pagination = useMemo(() => apiResponse?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  }, [apiResponse]);

  const handleCreate = () => {
    setEditingCity(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (city: City) => {
    setEditingCity(city);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this city?')) {
      try {
        await deleteCityMutation.mutateAsync(id);
        toast.success('City deleted successfully');
      } catch (error) {
        toast.error('Failed to delete city');
      }
    }
  };

  const handleToggleStatus = async (city: City) => {
    try {
      await updateCityMutation.mutateAsync({
        id: city.id.toString(),
        data: { isActive: !city.isActive }
      });
      toast.success(`City ${city.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      toast.error('Failed to update city status');
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortBy !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading cities</h2>
          <p className="text-gray-600 mt-2">Please try again later.</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur z-10 py-2">
        <div>
          <h2 className="text-2xl font-bold">Work Zone</h2>
          <p className="text-gray-600 mt-1">
            {isLoading ? 'Loading...' : `${pagination.total} Total Cities`}
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add City
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
                  placeholder="Search by city name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={isActiveFilter === null ? 'all' : isActiveFilter ? 'active' : 'inactive'}
              onValueChange={(value) => {
                setIsActiveFilter(value === 'all' ? null : value === 'active');
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Cities</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : cities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No cities found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center hover:text-primary"
                        >
                          City Name {getSortIcon('name')}
                        </button>
                      </th>
                      <th className="text-left p-4">Latitude</th>
                      <th className="text-left p-4">Longitude</th>
                      <th className="text-left p-4">
                        <button
                          onClick={() => handleSort('isActive')}
                          className="flex items-center hover:text-primary"
                        >
                          Status {getSortIcon('isActive')}
                        </button>
                      </th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cities.map((city) => (
                      <tr key={city.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 font-medium">{city.name}</td>
                        <td className="p-4 text-sm">{city.latitude.toFixed(6)}</td>
                        <td className="p-4 text-sm">{city.longitude.toFixed(6)}</td>
                        <td className="p-4">
                          <Badge variant={city.isActive ? 'default' : 'secondary'}>
                            {city.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Switch
                              checked={city.isActive}
                              onCheckedChange={() => handleToggleStatus(city)}
                              disabled={updateCityMutation.isPending}
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(city)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(city.id.toString())}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                  {pagination.total} cities
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

      {/* Form Dialog */}
      <CityForm
        city={editingCity}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCity(undefined);
        }}
      />
    </div>
  );
}

