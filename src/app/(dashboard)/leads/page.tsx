'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LeadForm } from '@/components/lead-form';
import { Lead } from '@/types';
import { Plus, Search, Edit2, Trash2, Loader2, CheckCircle2, Clock, ChevronDown, ArrowUpDown, Eye, MoreHorizontal } from 'lucide-react';
import { useLeads, useDeleteLead, useUpdateLead } from '@/hooks/use-leads';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// API response type
interface ApiLead {
  id: number;
  organizationId: number;
  name: string;
  contact: string;
  email: string;
  location: string;
  vehicleTypeId: number;
  scrapCategory: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  vehicleType: {
    id: number;
    name: string;
    description: string;
  };
  organization: {
    name: string;
  };
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

type SortKey = 'name' | 'createdAt' | 'status';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>();
  const [activeTab, setActiveTab] = useState<'All' | 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Rejected'>('All');
  const [scrapFilter, setScrapFilter] = useState<string>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [detailsLead, setDetailsLead] = useState<ApiLead | null>(null);

  // API hooks
  const { data: leadsData, isLoading, error } = useLeads({
    search: searchTerm || undefined,
    limit: 100,
  });
  const deleteLeadMutation = useDeleteLead();
  const updateLeadMutation = useUpdateLead();

  // Handle the actual API response structure
  const apiResponse = leadsData as unknown as ApiResponse;
  const leads = apiResponse?.data?.leads || [];
  const totalLeads = apiResponse?.data?.pagination?.total || 0;

  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = { New: 0, Contacted: 0, Qualified: 0, Converted: 0, Rejected: 0 };
    for (const l of leads) {
      const d = toDisplayStatus(l.status);
      if (d in counts) counts[d] += 1;
    }
    return counts;
  }, [leads]);

  const filteredSortedLeads = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let arr = leads.filter((l) => {
      const matchesSearch = !term || [l.name, l.contact, l.email, l.vehicleType?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
      const matchesStatus = activeTab === 'All' ? true : toDisplayStatus(l.status) === activeTab;
      const matchesScrap = scrapFilter === 'ALL' ? true : (l.scrapCategory || '').toUpperCase() === scrapFilter;
      return matchesSearch && matchesStatus && matchesScrap;
    });

    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'status') cmp = toDisplayStatus(a.status).localeCompare(toDisplayStatus(b.status));
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return arr;
  }, [leads, searchTerm, activeTab, scrapFilter, sortKey, sortDir]);

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
      await updateLeadMutation.mutateAsync({ id: String(lead.id), data: { status: value } as any });
      toast.success('Status updated');
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

  const scrapOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) if (l.scrapCategory) set.add(String(l.scrapCategory).toUpperCase());
    return Array.from(set);
  }, [leads]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur z-10 py-2">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="text-gray-600 mt-1">{isLoading ? 'Loading...' : `${totalLeads} Total Leads`}</p>
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
                    <span className={`text-xs rounded-full px-2 py-0.5 ${style.count}`}>{countsByStatus[tab] || 0}</span>
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
          ) : filteredSortedLeads.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No leads found.</div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="overflow-x-auto hidden sm:block">
                <Table className="min-w-[840px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button className="inline-flex items-center gap-1" onClick={() => toggleSort('name')}>
                          Name <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                      </TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Vehicle Type</TableHead>
                      <TableHead>Scrap Category</TableHead>
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
                    {filteredSortedLeads.map((lead) => (
                      <TableRow key={lead.id} className="even:bg-muted/50 border-b hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md" onClick={() => setDetailsLead(lead)}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>
                          <div>
                            <div>{lead.contact}</div>
                            <div className="text-sm text-gray-500">{lead.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{lead.vehicleType?.name || 'N/A'}</TableCell>
                        <TableCell className="capitalize">{String(lead.scrapCategory || '').replace(/_/g, ' ')}</TableCell>
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
                                  id: lead.id.toString(),
                                  organizationId: lead.organizationId,
                                  name: lead.name,
                                  contact: lead.contact,
                                  email: lead.email,
                                  vehicleTypeId: lead.vehicleTypeId,
                                  scrapCategory: lead.scrapCategory as any,
                                  address: lead.location,
                                  status: lead.status as any,
                                  createdAt: new Date(lead.createdAt),
                                  updatedAt: new Date(lead.updatedAt),
                                } as unknown as Lead;
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
                                handleDeleteLead(lead.id.toString());
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
                {filteredSortedLeads.map((lead) => (
                  <div key={lead.id} className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 cursor-pointer" onClick={() => setDetailsLead(lead)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{lead.name}</div>
                        <div className="text-sm text-muted-foreground">{lead.email}</div>
                      </div>
                      <StatusBadge status={lead.status} />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Contact</div>
                      <div>{lead.contact}</div>
                      <div className="text-muted-foreground">Vehicle</div>
                      <div className="capitalize">{lead.vehicleType?.name || 'N/A'}</div>
                      <div className="text-muted-foreground">Category</div>
                      <div className="capitalize">{String(lead.scrapCategory || '').replace(/_/g, ' ')}</div>
                      <div className="text-muted-foreground">Created</div>
                      <div>{formatDateHuman(lead.createdAt)}</div>
                    </div>
                    <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => setDetailsLead(lead)} className="hover:bg-indigo-50 text-indigo-600 transition-all duration-200">
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const convertedLead: Lead = {
                          id: lead.id.toString(),
                          organizationId: lead.organizationId,
                          name: lead.name,
                          contact: lead.contact,
                          email: lead.email,
                          vehicleTypeId: lead.vehicleTypeId,
                          scrapCategory: lead.scrapCategory as any,
                          address: lead.location,
                          status: lead.status as any,
                          createdAt: new Date(lead.createdAt),
                          updatedAt: new Date(lead.updatedAt),
                        } as unknown as Lead;
                        setEditingLead(convertedLead);
                        setIsFormOpen(true);
                      }} className="hover:bg-violet-50 text-violet-600 transition-all duration-200">
                        <Edit2 className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteLead(lead.id.toString())} className="hover:bg-rose-50 text-rose-600 transition-all duration-200">
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
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
              <div className="text-lg font-semibold">{detailsLead.name}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Contact</div>
                <div>{detailsLead.contact}</div>
                <div className="text-muted-foreground">Email</div>
                <div>{detailsLead.email}</div>
                <div className="text-muted-foreground">Vehicle</div>
                <div className="capitalize">{detailsLead.vehicleType?.name || 'N/A'}</div>
                <div className="text-muted-foreground">Category</div>
                <div className="capitalize">{String(detailsLead.scrapCategory || '').replace(/_/g, ' ')}</div>
                <div className="text-muted-foreground">Status</div>
                <div><StatusBadge status={detailsLead.status} /></div>
                <div className="text-muted-foreground">Created</div>
                <div>{formatDateHuman(detailsLead.createdAt)}</div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button onClick={() => {
                  const convertedLead: Lead = {
                    id: detailsLead.id.toString(),
                    organizationId: detailsLead.organizationId,
                    name: detailsLead.name,
                    contact: detailsLead.contact,
                    email: detailsLead.email,
                    vehicleTypeId: detailsLead.vehicleTypeId,
                    scrapCategory: detailsLead.scrapCategory as any,
                    address: detailsLead.location,
                    status: detailsLead.status as any,
                    createdAt: new Date(detailsLead.createdAt),
                    updatedAt: new Date(detailsLead.updatedAt),
                  } as unknown as Lead;
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