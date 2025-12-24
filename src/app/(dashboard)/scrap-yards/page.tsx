'use client';

import { useState, useEffect, useMemo } from 'react';
import { useScrapYards, useDeleteScrapYard, useUpdateScrapYard, useScrapYardStats } from '@/hooks/use-scrap-yards';
import { useScrapYardsStore } from '@/lib/store/scrap-yards-store';
import { ScrapYard } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, MapPin, Plus, Edit2, Trash2, MoreHorizontal, Filter, X, Loader2, CheckCircle2, Clock, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';
import { MapDialog } from '@/components/map-dialog';
import { ScrapYardForm } from '@/components/scrap-yard-form';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamically import Lottie for better performance
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// No Data Animation Component
function NoDataAnimation() {
  const [animationData, setAnimationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/animation/nodatafoundanimation.json')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load animation');
        return response.json();
      })
      .then((data) => {
        setAnimationData(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load animation:', error);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <div className="mt-2 text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!animationData) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-gray-400 text-sm">No scrap yards found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <p className="mt-4 text-gray-600 text-sm font-medium">No scrap yards found</p>
      <p className="mt-1 text-gray-400 text-xs">Try adjusting your filters or create a new scrap yard</p>
    </div>
  );
}

// Scrap Yard Avatar Component
function ScrapYardAvatar({ name, className = '' }: { name: string; className?: string }) {
  const firstLetter = (name || 'S').charAt(0).toUpperCase();
  return (
    <div className={cn(
      "h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-md",
      className
    )}>
      <span className="text-white font-semibold text-sm">{firstLetter}</span>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status, showDropdownIcon = false }: { status: string; showDropdownIcon?: boolean }) {
  const isActive = status === 'Active';
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300",
      isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
    )}>
      {isActive ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {status}
      {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
    </span>
  );
}

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

type TabKey = 'All' | 'Active' | 'Inactive';

export default function ScrapYardsPage() {
  const activeTab = useScrapYardsStore((state) => state.activeTab);
  const setActiveTab = useScrapYardsStore((state) => state.setActiveTab);
  const searchTerm = useScrapYardsStore((state) => state.searchTerm);
  const setSearchTerm = useScrapYardsStore((state) => state.setSearchTerm);
  const page = useScrapYardsStore((state) => state.page);
  const setPage = useScrapYardsStore((state) => state.setPage);
  const limit = useScrapYardsStore((state) => state.limit);
  const setLimit = useScrapYardsStore((state) => state.setLimit);

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, setPage]);

  const getStatusFilter = (tab: TabKey): string | undefined => {
    if (tab === 'All') return undefined;
    if (tab === 'Active') return 'true';
    if (tab === 'Inactive') return 'false';
    return undefined;
  };

  const { data: scrapYardsData, isLoading, error, refetch } = useScrapYards({
    page,
    limit,
    search: debouncedSearchTerm || undefined,
    status: getStatusFilter(activeTab),
  });

  const { data: statsData } = useScrapYardStats();

  const deleteScrapYardMutation = useDeleteScrapYard();
  const updateScrapYardMutation = useUpdateScrapYard();

  const apiResponse = scrapYardsData as unknown as ApiResponse;
  const scrapYards = useMemo(() => apiResponse?.data?.scrapYards || [], [apiResponse]) as ScrapYard[];
  const pagination = useMemo(() => apiResponse?.data?.pagination || {
    page: 1, limit: 10, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false
  }, [apiResponse]);

  const getTabCount = (tab: TabKey): number => {
    if (!statsData) return 0;
    switch (tab) {
      case 'All': return statsData.total;
      case 'Active': return statsData.active;
      case 'Inactive': return (statsData.total - statsData.active);
      default: return 0;
    }
  };

  const getTabStyle = (tab: TabKey) => {
    switch (tab) {
      case 'All': return { activeText: 'text-cyan-700', activeBg: 'bg-cyan-50', underline: 'bg-cyan-500', count: 'bg-cyan-100 text-cyan-700' };
      case 'Active': return { activeText: 'text-green-700', activeBg: 'bg-green-50', underline: 'bg-green-600', count: 'bg-green-100 text-green-700' };
      case 'Inactive': return { activeText: 'text-gray-700', activeBg: 'bg-gray-50', underline: 'bg-gray-600', count: 'bg-gray-100 text-gray-700' };
      default: return { activeText: 'text-primary', activeBg: 'bg-muted', underline: 'bg-primary', count: 'bg-muted text-foreground' };
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteScrapYardMutation.mutateAsync(id);
        toast.success('Scrap yard deleted successfully');
      } catch (error) {
        toast.error('Failed to delete scrap yard');
      }
    }
  };

  const handleLocationClick = (yard: ScrapYard) => {
    if (yard.latitude && yard.longitude && yard.latitude !== 0 && yard.longitude !== 0) {
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



  const onInlineStatusChange = async (yard: ScrapYard, value: string) => {
    try {
      const newActiveStatus = value === 'Active';
      if (yard.isActive === newActiveStatus) return;

      await updateScrapYardMutation.mutateAsync({
        id: yard.id,
        data: { isActive: newActiveStatus }
      });
      toast.success(`Scrap yard ${newActiveStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600">Error loading scrap yards</h2>
        <p className="text-gray-600 mt-2">Please try again later.</p>
        <Button onClick={() => refetch()} className="mt-4">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-xl font-bold text-gray-900">Scrap Yards</CardTitle>

            <div className="flex items-center gap-2 flex-wrap">
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
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onBlur={() => { if (!searchTerm) setIsSearchOpen(false); }}
                    autoFocus
                    className="w-64 pl-10 pr-10 rounded-lg border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  {searchTerm && (
                    <button onClick={() => { setSearchTerm(''); setIsSearchOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={cn(
                  "border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 h-9 w-9 p-0",
                  isFilterOpen && "border-cyan-500 bg-cyan-50"
                )}
                title={isFilterOpen ? 'Hide filters' : 'Show filters'}
              >
                <Filter className="h-4 w-4" />
              </Button>

              <Button
                onClick={() => { setEditingScrapYard(undefined); setIsFormOpen(true); }}
                className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 w-9 p-0"
                title="Add Scrap Yard"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading || !mounted ? (
            <div className="p-4">
              <TableSkeleton columnCount={4} rowCount={limit} />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b-2 border-gray-200 bg-gray-50/50">
                      <TableHead colSpan={4} className="p-0 bg-transparent h-auto">
                        <div className="w-full overflow-x-auto">
                          <div className="inline-flex items-center gap-1 px-6 py-3">
                            {(['All', 'Active', 'Inactive'] as const).map((tab) => {
                              const style = getTabStyle(tab);
                              const isActive = activeTab === tab;
                              return (
                                <button
                                  key={tab}
                                  onClick={() => setActiveTab(tab)}
                                  className={cn(
                                    "relative px-4 py-2 text-sm font-medium transition-all rounded-t-md",
                                    isActive ? `${style.activeText} ${style.activeBg} shadow-sm` : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                  )}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    {tab}
                                    <span className={cn("text-xs rounded-full px-2 py-0.5 font-medium", style.count)}>
                                      {getTabCount(tab)}
                                    </span>
                                  </span>
                                  {isActive && <span className={cn("absolute left-0 right-0 -bottom-0.5 h-0.5 rounded", style.underline)} />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </TableHead>
                    </TableRow>
                    <TableRow className="hover:bg-transparent border-b bg-white">
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Scrap Yard
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Location
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
                    {scrapYards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <NoDataAnimation />
                        </TableCell>
                      </TableRow>
                    ) : (
                      scrapYards.map((yard) => {
                        const status = yard.isActive !== false ? 'Active' : 'Inactive';

                        return (
                          <TableRow
                            key={yard.id}
                            className="border-b last:border-b-0 hover:bg-gray-50 transition-colors bg-white group"
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <ScrapYardAvatar name={yard.yardName} />
                                <div className="flex flex-col">
                                  <span className="font-bold text-gray-900 group-hover:text-cyan-600 transition-colors">
                                    {yard.yardName}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1 max-w-[250px]">
                                {yard.address ? (
                                  <span className="text-sm text-gray-700 truncate" title={yard.address}>
                                    {yard.address}
                                  </span>
                                ) : (
                                  <span className="text-sm text-gray-400 italic">No address</span>
                                )}

                                {yard.latitude && yard.longitude && yard.latitude !== 0 && yard.longitude !== 0 ? (
                                  <button
                                    onClick={() => handleLocationClick(yard)}
                                    className="flex items-center text-xs text-cyan-600 hover:text-cyan-800 hover:underline cursor-pointer w-fit font-medium"
                                  >
                                    <MapPin className="h-3 w-3 mr-1" />
                                    <span>View on Map</span>
                                  </button>
                                ) : yard.address ? (
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(yard.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center text-xs text-cyan-600 hover:text-cyan-800 hover:underline cursor-pointer w-fit font-medium"
                                  >
                                    <MapPin className="h-3 w-3 mr-1" />
                                    <span>Google Maps</span>
                                  </a>
                                ) : null}
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                <Select value={status} onValueChange={(v) => onInlineStatusChange(yard, v)}>
                                  <SelectTrigger className="h-auto w-auto p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none max-w-none min-w-0 overflow-visible">
                                    <div className="flex items-center">
                                      <StatusBadge status={status} showDropdownIcon={true} />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent className="min-w-[120px] rounded-lg shadow-lg border border-gray-200 bg-white p-1">
                                    {['Active', 'Inactive'].map((s) => (
                                      <SelectItem key={s} value={s} className="cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-gray-100">
                                        {s}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-cyan-600">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem onClick={() => { setEditingScrapYard(yard); setIsFormOpen(true); }} className="cursor-pointer">
                                    <Edit2 className="mr-2 h-4 w-4 text-cyan-600" />
                                    <span>Edit</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(yard.id, yard.yardName)}
                                    className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                <RowsPerPage
                  value={limit}
                  onChange={(value) => { setLimit(value); setPage(1); }}
                  options={[5, 10, 20, 50]}
                />
                <div className="text-xs text-gray-500 font-medium">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} scrap yards
                </div>
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={(p) => setPage(p)}
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
