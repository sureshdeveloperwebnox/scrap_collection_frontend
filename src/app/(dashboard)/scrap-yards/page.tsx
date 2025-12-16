'use client';

import { useState, useEffect, useMemo } from 'react';
import { useScrapYards, useDeleteScrapYard, useUpdateScrapYard } from '@/hooks/use-scrap-yards';
import { useScrapYardsStore } from '@/lib/store/scrap-yards-store';
import { ScrapYard } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Building2, Users, Plus, Edit, Trash2, MoreVertical, Filter, X } from 'lucide-react';
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
  // Use Zustand store for state management
  const {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    limit,
    setLimit,
  } = useScrapYardsStore();

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    title: string;
    address?: string;
  } | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScrapYard, setEditingScrapYard] = useState<ScrapYard | undefined>();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, setPage]);

  // FIX: Correct status mapping - use boolean string for API
  const getStatusFilter = (tab: 'All' | 'Active' | 'Inactive'): string | undefined => {
    if (tab === 'All') return undefined;
    if (tab === 'Active') return 'true';  // Send as string 'true'
    if (tab === 'Inactive') return 'false'; // Send as string 'false'
    return undefined;
  };

  // Fetch scrap yards - OPTIMIZED with correct status filter
  const { data: scrapYardsData, isLoading, error, refetch } = useScrapYards({
    page,
    limit,
    search: debouncedSearchTerm || undefined,
    status: getStatusFilter(activeTab),
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
      <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-xl font-bold text-gray-900">Scrap Yards</CardTitle>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 h-9 w-9 p-0"
              >
                <Search className="h-4 w-4" />
              </Button>

              {isSearchOpen && (
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search scrap yards..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={() => {
                      if (!searchTerm) setIsSearchOpen(false);
                    }}
                    autoFocus
                    className="w-64 pl-10 pr-10 rounded-lg border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  {searchTerm && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setIsSearchOpen(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 h-9 w-9 p-0 ${activeTab !== 'All' ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : ''}`}
                title={isFilterOpen ? 'Hide filters' : 'Show filters'}
              >
                <Filter className={`h-4 w-4 ${activeTab !== 'All' ? 'text-cyan-700' : ''}`} />
              </Button>

              <Button
                onClick={handleCreate}
                className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 w-9 p-0"
                title="Add Scrap Yard"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isFilterOpen && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <div className="flex gap-3">
                {(['All', 'Active', 'Inactive'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${activeTab === tab
                      ? 'bg-cyan-50 text-cyan-700 border-cyan-300'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {isLoading ? 'Loading...' : `${totalYards} total scrap yards`}
              </p>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Table */}
      <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-900">All Scrap Yards</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-500 text-sm">
              Loading scrap yards...
            </div>
          ) : scrapYards.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
              No scrap yards found
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Scrap Yard
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Location
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Manager
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Status
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scrapYards.map((yard) => {
                      const manager = getManager(yard);
                      const status = getStatus(yard);

                      return (
                        <TableRow
                          key={yard.id}
                          className="border-b last:border-b-0 hover:bg-gray-50 transition-colors bg-white"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50">
                                <Building2 className="h-4 w-4 text-cyan-600" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-gray-900">
                                  {yard.yardName}
                                </span>
                                {yard.address && (
                                  <span className="text-xs text-gray-500 line-clamp-1">
                                    {yard.address}
                                  </span>
                                )}
                              </div>
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
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
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
