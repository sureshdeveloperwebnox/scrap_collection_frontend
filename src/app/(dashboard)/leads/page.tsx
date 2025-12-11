'use client';

import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LeadForm } from '@/components/lead-form';
import { Lead } from '@/types';
import { Plus, Search, Edit2, Trash2, Loader2, CheckCircle2, Clock, ChevronDown, ArrowUpDown, Eye, MoreHorizontal } from 'lucide-react';
import { useLeads, useDeleteLead, useUpdateLead } from '@/hooks/use-leads';
import { useLeadStats } from '@/hooks/use-lead-stats';
import { useLeadStatsStore } from '@/lib/store/lead-stats-store';
import { getImageUrl, getImageUrls } from '@/utils/image-utils';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';

// API response type - matches backend Lead model
interface ApiLead {
  id: string;
  organizationId: number;
  fullName: string;
  phone: string;
  email?: string;
  vehicleType: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehicleCondition: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  leadSource: string;
  photos?: string[];
  notes?: string;
  status: string;
  customerId?: string;
  createdAt: string;
  updatedAt: string;
  organization?: {
    name: string;
  };
  customer?: any;
}

interface ApiResponse {
  version: string;
  validationErrors: any[];
  code: number;
  status: string;
  message: string;
  data: {
    leads: ApiLead[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

type SortKey = 'fullName' | 'createdAt' | 'status';

function formatDateHuman(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yday = new Date();
  yday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yday)) return 'Yesterday';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function toDisplayStatus(status: string): 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Rejected' | string {
  const s = status?.toLowerCase();
  if (s === 'pending' || s === 'new') return 'New';
  if (s === 'contacted') return 'Contacted';
  if (s === 'qualified') return 'Qualified';
  if (s === 'converted') return 'Converted';
  if (s === 'rejected') return 'Rejected';
  return status;
}

// Tab color styles
type TabKey = 'All' | 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Rejected';
function getTabStyle(tab: TabKey) {
  switch (tab) {
    case 'New':
      return { activeText: 'text-blue-700', activeBg: 'bg-blue-50', underline: 'bg-blue-600', count: 'bg-blue-100 text-blue-700' };
    case 'Contacted':
      return { activeText: 'text-indigo-700', activeBg: 'bg-indigo-50', underline: 'bg-indigo-600', count: 'bg-indigo-100 text-indigo-700' };
    case 'Qualified':
      return { activeText: 'text-teal-700', activeBg: 'bg-teal-50', underline: 'bg-teal-600', count: 'bg-teal-100 text-teal-700' };
    case 'Converted':
      return { activeText: 'text-green-700', activeBg: 'bg-green-50', underline: 'bg-green-600', count: 'bg-green-100 text-green-700' };
    case 'Rejected':
      return { activeText: 'text-rose-700', activeBg: 'bg-rose-50', underline: 'bg-rose-600', count: 'bg-rose-100 text-rose-700' };
    default:
      return { activeText: 'text-primary', activeBg: 'bg-muted', underline: 'bg-primary', count: 'bg-muted text-foreground' };
  }
}

function StatusBadge({ status }: { status: string }) {
  const display = toDisplayStatus(status);
  const base = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm';
  if (display === 'Converted') return (
    <span className={`${base} bg-green-100 text-green-700`}><CheckCircle2 className="h-3 w-3" /> Converted</span>
  );
  if (display === 'New') return (
    <span className={`${base} bg-blue-100 text-blue-700`}><Clock className="h-3 w-3" /> New</span>
  );
  if (display === 'Contacted') return (
    <span className={`${base} bg-indigo-50 text-indigo-700 border border-indigo-200`}><Clock className="h-3 w-3" /> Contacted</span>
  );
  if (display === 'Qualified') return (
    <span className={`${base} bg-teal-50 text-teal-700 border border-teal-200`}><CheckCircle2 className="h-3 w-3" /> Qualified</span>
  );
  if (display === 'Rejected') return (
    <span className={`${base} bg-red-100 text-red-700`}><Clock className="h-3 w-3" /> Rejected</span>
  );
  return <span className={`${base} bg-gray-100 text-gray-700`}>{display}</span>;
}

export default function LeadsPage() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>();
  const [activeTab, setActiveTab] = useState<'All' | 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Rejected'>('All');
  const [scrapFilter, setScrapFilter] = useState<string>('ALL');
  
  // Sorting state
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [detailsLead, setDetailsLead] = useState<ApiLead | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Map tab to status for API
  const getStatusFromTab = (tab: string): string | undefined => {
    const statusMap: Record<string, string> = {
      'New': 'NEW',
      'Contacted': 'CONTACTED',
      'Qualified': 'QUOTED',
      'Converted': 'CONVERTED',
      'Rejected': 'REJECTED'
    };
    return tab === 'All' ? undefined : statusMap[tab];
  };

  // Map sort key to API sortBy
  const getApiSortBy = (key: SortKey): 'fullName' | 'phone' | 'email' | 'status' | 'createdAt' | 'updatedAt' => {
    const sortMap: Record<SortKey, 'fullName' | 'phone' | 'email' | 'status' | 'createdAt' | 'updatedAt'> = {
      'fullName': 'fullName',
      'createdAt': 'createdAt',
      'status': 'status'
    };
    return sortMap[key] || 'createdAt';
  };

  // API hooks with server-side pagination, filtering, and sorting
  const { data: leadsData, isLoading, error } = useLeads({
    page: currentPage,
    limit: rowsPerPage,
    search: debouncedSearchTerm || undefined,
    status: getStatusFromTab(activeTab) as any,
    vehicleCondition: scrapFilter !== 'ALL' ? scrapFilter : undefined,
    sortBy: getApiSortBy(sortKey),
    sortOrder: sortDir,
  });
  const deleteLeadMutation = useDeleteLead();
  const updateLeadMutation = useUpdateLead();

  // Fetch and sync lead stats to Zustand store
  useLeadStats();
  
  // Get stats from Zustand store
  const stats = useLeadStatsStore((state) => state.stats);

  // Handle the actual API response structure
  const apiResponse = leadsData as unknown as ApiResponse;
  const leads = useMemo(() => apiResponse?.data?.leads || [], [apiResponse]);
  const pagination = useMemo(() => apiResponse?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  }, [apiResponse]);
  
  const totalLeads = pagination.total;

  // Map stats to tab counts
  const getTabCount = (tab: string): number => {
    if (!stats) return 0;
    switch (tab) {
      case 'All':
        return stats.total;
      case 'New':
        return stats.new;
      case 'Contacted':
        return stats.contacted;
      case 'Qualified':
        return stats.quoted; // Backend uses 'quoted', frontend uses 'Qualified'
      case 'Converted':
        return stats.converted;
      case 'Rejected':
        return stats.rejected;
      default:
        return 0;
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, scrapFilter, rowsPerPage]);

  // Get available vehicle conditions (this could be from a separate API call)
  const scrapOptions = ['ALL', 'JUNK', 'DAMAGED', 'WRECKED', 'ACCIDENTAL', 'FULLY_SCRAP'];

  const handleDeleteLead = async (id: string) => {
    if (confirm('Delete this lead?')) {
      try {
        await deleteLeadMutation.mutateAsync(id);
        toast.success('Lead deleted');
      } catch (error) {
        console.error('Error deleting lead:', error);
        toast.error('Failed to delete lead');
      }
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const onInlineStatusChange = async (lead: ApiLead, value: string) => {
    try {
      const oldStatus = lead.status;
      await updateLeadMutation.mutateAsync({ id: String(lead.id), data: { status: value } as any });
      toast.success('Status updated');
      
      // Zustand store will be updated automatically by the mutation hook
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading leads</h2>
          <p className="text-gray-600 mt-2">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur z-10 py-2">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-gray-600 mt-1">
            {isLoading ? 'Loading...' : `${stats?.total ?? totalLeads} Total Leads`}
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="hidden sm:inline-flex bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </div>

      {/* Tabs */}
      <div className="w-full overflow-x-auto">
        <div className="inline-flex items-center gap-2 border-b">
          {(['All','New','Contacted','Qualified','Converted','Rejected'] as const).map((tab) => {
            const style = getTabStyle(tab);
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-2 text-sm font-medium transition-colors rounded-t-md ${isActive ? `${style.activeText} ${style.activeBg}` : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}
              >
                <span className="inline-flex items-center gap-2">
                  {tab}
                  {tab !== 'All' && (
                    <span className={`text-xs rounded-full px-2 py-0.5 ${style.count}`}>
                      {getTabCount(tab)}
                    </span>
                  )}
                </span>
                {isActive && <span className={`absolute left-0 right-0 -bottom-px h-0.5 ${style.underline} rounded`} />}
              </button>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by name, contact, or vehicle…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={scrapFilter} onValueChange={(v) => setScrapFilter(v)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Scrap Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {scrapOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading leads...</span>
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No leads found.</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="overflow-x-auto hidden sm:block">
                <Table className="min-w-[840px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button className="inline-flex items-center gap-1" onClick={() => toggleSort('fullName')}>
                          Name <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                      </TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Vehicle Type</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1" onClick={() => toggleSort('status')}>
                          Status <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1" onClick={() => toggleSort('createdAt')}>
                          Created <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                      </TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id} className="even:bg-muted/50 border-b hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md" onClick={() => setDetailsLead(lead)}>
                        <TableCell className="font-medium">{lead.fullName || 'N/A'}</TableCell>
                        <TableCell>
                          <div>
                            <div>{lead.phone || 'N/A'}</div>
                            {lead.email && <div className="text-sm text-gray-500">{lead.email}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{lead.vehicleType || 'N/A'}</TableCell>
                        <TableCell className="capitalize">{String(lead.vehicleCondition || '').replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <StatusBadge status={lead.status} />
                            <Select value={lead.status} onValueChange={(v) => onInlineStatusChange(lead, v)}>
                              <SelectTrigger className="h-7 w-[30px] px-2 bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 rounded-md">
                                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                              </SelectTrigger>
                              <SelectContent>
                                {['NEW','CONTACTED','QUALIFIED','CONVERTED','REJECTED','pending'].map((s) => (
                                  <SelectItem key={s} value={s}>{toDisplayStatus(s)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell>{formatDateHuman(lead.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailsLead(lead);
                              }}
                              className="h-8 w-8 p-0 hover:bg-indigo-50 text-indigo-600 transition-all duration-200"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                const convertedLead: Lead = {
                                  id: lead.id,
                                  organizationId: lead.organizationId,
                                  fullName: lead.fullName || '',
                                  phone: lead.phone || '',
                                  email: lead.email,
                                  vehicleType: lead.vehicleType as any,
                                  vehicleMake: lead.vehicleMake,
                                  vehicleModel: lead.vehicleModel,
                                  vehicleYear: lead.vehicleYear,
                                  vehicleCondition: lead.vehicleCondition as any,
                                  locationAddress: lead.locationAddress,
                                  latitude: lead.latitude,
                                  longitude: lead.longitude,
                                  leadSource: lead.leadSource as any,
                                  photos: lead.photos,
                                  notes: lead.notes,
                                  status: lead.status as any,
                                  customerId: lead.customerId,
                                  createdAt: new Date(lead.createdAt),
                                  updatedAt: new Date(lead.updatedAt),
                                };
                                setEditingLead(convertedLead);
                                setIsFormOpen(true);
                              }}
                              className="h-8 w-8 p-0 hover:bg-violet-50 text-violet-600 transition-all duration-200"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLead(lead.id);
                              }}
                              className="h-8 w-8 p-0 hover:bg-rose-50 text-rose-600 transition-all duration-200"
                            >
                              {deleteLeadMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden space-y-3">
                {leads.map((lead) => (
                  <div key={lead.id} className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 cursor-pointer" onClick={() => setDetailsLead(lead)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{lead.fullName || 'N/A'}</div>
                        {lead.email && <div className="text-sm text-muted-foreground">{lead.email}</div>}
                      </div>
                      <StatusBadge status={lead.status} />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Phone</div>
                      <div>{lead.phone || 'N/A'}</div>
                      <div className="text-muted-foreground">Vehicle</div>
                      <div className="capitalize">{lead.vehicleType || 'N/A'}</div>
                      <div className="text-muted-foreground">Condition</div>
                      <div className="capitalize">{String(lead.vehicleCondition || '').replace(/_/g, ' ')}</div>
                      <div className="text-muted-foreground">Created</div>
                      <div>{formatDateHuman(lead.createdAt)}</div>
                    </div>
                    <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => setDetailsLead(lead)} className="hover:bg-indigo-50 text-indigo-600 transition-all duration-200">
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const convertedLead: Lead = {
                          id: lead.id,
                          organizationId: lead.organizationId,
                          fullName: lead.fullName || '',
                          phone: lead.phone || '',
                          email: lead.email,
                          vehicleType: lead.vehicleType as any,
                          vehicleMake: lead.vehicleMake,
                          vehicleModel: lead.vehicleModel,
                          vehicleYear: lead.vehicleYear,
                          vehicleCondition: lead.vehicleCondition as any,
                          locationAddress: lead.locationAddress,
                          latitude: lead.latitude,
                          longitude: lead.longitude,
                          leadSource: lead.leadSource as any,
                          photos: lead.photos,
                          notes: lead.notes,
                          status: lead.status as any,
                          customerId: lead.customerId,
                          createdAt: new Date(lead.createdAt),
                          updatedAt: new Date(lead.updatedAt),
                        };
                        setEditingLead(convertedLead);
                        setIsFormOpen(true);
                      }} className="hover:bg-violet-50 text-violet-600 transition-all duration-200">
                        <Edit2 className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteLead(lead.id)} className="hover:bg-rose-50 text-rose-600 transition-all duration-200">
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
        
        {/* Pagination Controls */}
        {!isLoading && pagination.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t bg-gray-50/50">
            <div className="flex items-center gap-4">
              <RowsPerPage
                value={rowsPerPage}
                onChange={(value) => {
                  setRowsPerPage(value);
                  setCurrentPage(1);
                }}
              />
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalLeads)} of {totalLeads} leads
              </div>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </Card>

      {/* Sticky Add button for mobile */}
      <Button onClick={() => setIsFormOpen(true)} className="sm:hidden fixed bottom-6 right-6 rounded-full shadow-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white transform hover:scale-110 transition-all duration-200 hover:shadow-2xl">
        <Plus className="mr-2 h-4 w-4" /> Add Lead
      </Button>

      {/* Quick View Dialog */}
      <Dialog open={!!detailsLead} onOpenChange={(open) => !open && setDetailsLead(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {detailsLead && (
            <div className="space-y-3">
              <div className="text-lg font-semibold">{detailsLead.fullName || 'N/A'}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Phone</div>
                <div>{detailsLead.phone || 'N/A'}</div>
                {detailsLead.email && (
                  <>
                    <div className="text-muted-foreground">Email</div>
                    <div>{detailsLead.email}</div>
                  </>
                )}
                <div className="text-muted-foreground">Vehicle Type</div>
                <div className="capitalize">{detailsLead.vehicleType || 'N/A'}</div>
                <div className="text-muted-foreground">Condition</div>
                <div className="capitalize">{String(detailsLead.vehicleCondition || '').replace(/_/g, ' ')}</div>
                {detailsLead.vehicleMake && (
                  <>
                    <div className="text-muted-foreground">Make</div>
                    <div>{detailsLead.vehicleMake}</div>
                  </>
                )}
                {detailsLead.vehicleModel && (
                  <>
                    <div className="text-muted-foreground">Model</div>
                    <div>{detailsLead.vehicleModel}</div>
                  </>
                )}
                {detailsLead.locationAddress && (
                  <>
                    <div className="text-muted-foreground">Address</div>
                    <div>{detailsLead.locationAddress}</div>
                  </>
                )}
                <div className="text-muted-foreground">Status</div>
                <div><StatusBadge status={detailsLead.status} /></div>
                <div className="text-muted-foreground">Created</div>
                <div>{formatDateHuman(detailsLead.createdAt)}</div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button onClick={() => {
                  const convertedLead: Lead = {
                    id: detailsLead.id,
                    organizationId: detailsLead.organizationId,
                    fullName: detailsLead.fullName || '',
                    phone: detailsLead.phone || '',
                    email: detailsLead.email,
                    vehicleType: detailsLead.vehicleType as any,
                    vehicleMake: detailsLead.vehicleMake,
                    vehicleModel: detailsLead.vehicleModel,
                    vehicleYear: detailsLead.vehicleYear,
                    vehicleCondition: detailsLead.vehicleCondition as any,
                    locationAddress: detailsLead.locationAddress,
                    latitude: detailsLead.latitude,
                    longitude: detailsLead.longitude,
                    leadSource: detailsLead.leadSource as any,
                    photos: detailsLead.photos,
                    notes: detailsLead.notes,
                    status: detailsLead.status as any,
                    customerId: detailsLead.customerId,
                    createdAt: new Date(detailsLead.createdAt),
                    updatedAt: new Date(detailsLead.updatedAt),
                  };
                  setEditingLead(convertedLead);
                  setIsFormOpen(true);
                }}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="outline" onClick={() => setDetailsLead(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <LeadForm
        lead={editingLead}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingLead(undefined);
        }}
      />
    </div>
  );
}