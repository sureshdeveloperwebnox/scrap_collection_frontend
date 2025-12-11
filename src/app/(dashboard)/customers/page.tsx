'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomerForm } from '@/components/customer-form';
import { Customer } from '@/types';
import { Plus, Search, Edit2, Trash2, Loader2, CheckCircle2, Clock, ChevronDown, ArrowUpDown, Eye, MoreHorizontal, Crown, Shield, UserX } from 'lucide-react';
import { useCustomers, useDeleteCustomer, useUpdateCustomer } from '@/hooks/use-customers';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// API response type
interface ApiCustomer {
  id: number;
  organizationId: number;
  name: string;
  contact: string;
  email: string;
  address: string;
  vehicleTypeId: number;
  scrapCategory: string;
  status: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
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
    customers: ApiCustomer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

type SortKey = 'name' | 'createdAt' | 'status' | 'totalOrders' | 'totalSpent';

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

function toDisplayStatus(status: string): 'Active' | 'Inactive' | 'VIP' | 'Blocked' | string {
  const s = status?.toLowerCase();
  if (s === 'active') return 'Active';
  if (s === 'inactive') return 'Inactive';
  if (s === 'vip') return 'VIP';
  if (s === 'blocked') return 'Blocked';
  return status;
}

// Tab color styles
type TabKey = 'All' | 'Active' | 'Inactive' | 'VIP' | 'Blocked';
function getTabStyle(tab: TabKey) {
  switch (tab) {
    case 'Active':
      return { activeText: 'text-green-700', activeBg: 'bg-green-50', underline: 'bg-green-600', count: 'bg-green-100 text-green-700' };
    case 'Inactive':
      return { activeText: 'text-gray-700', activeBg: 'bg-gray-50', underline: 'bg-gray-600', count: 'bg-gray-100 text-gray-700' };
    case 'VIP':
      return { activeText: 'text-yellow-700', activeBg: 'bg-yellow-50', underline: 'bg-yellow-600', count: 'bg-yellow-100 text-yellow-700' };
    case 'Blocked':
      return { activeText: 'text-red-700', activeBg: 'bg-red-50', underline: 'bg-red-600', count: 'bg-red-100 text-red-700' };
    default:
      return { activeText: 'text-primary', activeBg: 'bg-muted', underline: 'bg-primary', count: 'bg-muted text-foreground' };
  }
}

function StatusBadge({ status }: { status: string }) {
  const display = toDisplayStatus(status);
  const base = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm';
  
  if (display === 'Active') return (
    <span className={`${base} bg-green-100 text-green-700`}><CheckCircle2 className="h-3 w-3" /> Active</span>
  );
  if (display === 'VIP') return (
    <span className={`${base} bg-yellow-100 text-yellow-700`}><Crown className="h-3 w-3" /> VIP</span>
  );
  if (display === 'Inactive') return (
    <span className={`${base} bg-gray-100 text-gray-700`}><UserX className="h-3 w-3" /> Inactive</span>
  );
  if (display === 'Blocked') return (
    <span className={`${base} bg-red-100 text-red-700`}><Shield className="h-3 w-3" /> Blocked</span>
  );
  
  return <span className={`${base} bg-gray-100 text-gray-700`}>{display}</span>;
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined>();
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Inactive' | 'VIP' | 'Blocked'>('All');
  const [scrapFilter, setScrapFilter] = useState<string>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [detailsCustomer, setDetailsCustomer] = useState<ApiCustomer | null>(null);

  // API hooks
  const { data: customersData, isLoading, error } = useCustomers({
    search: searchTerm || undefined,
    limit: 100,
  });
  const deleteCustomerMutation = useDeleteCustomer();
  const updateCustomerMutation = useUpdateCustomer();

  // Handle the actual API response structure
  const apiResponse = customersData as unknown as ApiResponse;
  const customers = useMemo(() => apiResponse?.data?.customers || [], [apiResponse]);
  const totalCustomers = useMemo(() => apiResponse?.data?.pagination?.total || 0, [apiResponse]);

  const countsByStatus = useMemo(() => {
    const counts: Record<string, number> = { Active: 0, Inactive: 0, VIP: 0, Blocked: 0 };
    for (const c of customers) {
      const d = toDisplayStatus(c.status);
      if (d in counts) counts[d] += 1;
    }
    return counts;
  }, [customers]);

  const filteredSortedCustomers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let arr = customers.filter((c) => {
      const matchesSearch = !term || [c.name, c.contact, c.email, c.vehicleType?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term));
      const matchesStatus = activeTab === 'All' ? true : toDisplayStatus(c.status) === activeTab;
      const matchesScrap = scrapFilter === 'ALL' ? true : (c.scrapCategory || '').toUpperCase() === scrapFilter;
      return matchesSearch && matchesStatus && matchesScrap;
    });

    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'status') cmp = toDisplayStatus(a.status).localeCompare(toDisplayStatus(b.status));
      else if (sortKey === 'totalOrders') cmp = (a.totalOrders || 0) - (b.totalOrders || 0);
      else if (sortKey === 'totalSpent') cmp = (a.totalSpent || 0) - (b.totalSpent || 0);
      else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return arr;
  }, [customers, searchTerm, activeTab, scrapFilter, sortKey, sortDir]);

  const scrapOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of customers) if (c.scrapCategory) set.add(String(c.scrapCategory).toUpperCase());
    return Array.from(set);
  }, [customers]);

  const handleDeleteCustomer = async (id: string) => {
    if (confirm('Delete this customer?')) {
      try {
        await deleteCustomerMutation.mutateAsync(id);
        toast.success('Customer deleted');
      } catch (error) {
        console.error('Error deleting customer:', error);
        toast.error('Failed to delete customer');
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

  const onInlineStatusChange = async (customer: ApiCustomer, value: string) => {
    try {
      await updateCustomerMutation.mutateAsync({ id: String(customer.id), data: { status: value } as any });
      toast.success('Status updated');
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading customers</h2>
          <p className="text-gray-600 mt-2">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur z-10 py-2">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-gray-600 mt-1">{isLoading ? 'Loading...' : `${totalCustomers} Total Customers`}</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="hidden sm:inline-flex bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Tabs */}
      <div className="w-full overflow-x-auto">
        <div className="inline-flex items-center gap-2 border-b">
          {(['All','Active','Inactive','VIP','Blocked'] as const).map((tab) => {
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
              <span className="ml-2 text-gray-600">Loading customers...</span>
            </div>
          ) : filteredSortedCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No customers found.</div>
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
                        <button className="inline-flex items-center gap-1" onClick={() => toggleSort('totalOrders')}>
                          Orders <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button className="inline-flex items-center gap-1" onClick={() => toggleSort('totalSpent')}>
                          Total Spent <ArrowUpDown className="h-3.5 w-3.5" />
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
                    {filteredSortedCustomers.map((customer) => (
                      <TableRow key={customer.id} className="even:bg-muted/50 border-b hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md" onClick={() => setDetailsCustomer(customer)}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>
                          <div>
                            <div>{customer.contact}</div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{customer.vehicleType?.name || 'N/A'}</TableCell>
                        <TableCell className="capitalize">{String(customer.scrapCategory || '').replace(/_/g, ' ')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <StatusBadge status={customer.status} />
                            <Select value={customer.status} onValueChange={(v) => onInlineStatusChange(customer, v)}>
                              <SelectTrigger className="h-7 w-[30px] px-2 bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 rounded-md">
                                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                              </SelectTrigger>
                              <SelectContent>
                                {['ACTIVE','INACTIVE','VIP','BLOCKED'].map((s) => (
                                  <SelectItem key={s} value={s}>{toDisplayStatus(s)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{customer.totalOrders || 0}</TableCell>
                        <TableCell className="text-center">${(customer.totalSpent || 0).toLocaleString()}</TableCell>
                        <TableCell>{formatDateHuman(customer.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setDetailsCustomer(customer);
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
                                const convertedCustomer: Customer = {
                                  id: customer.id.toString(),
                                  organizationId: customer.organizationId,
                                  name: customer.name,
                                  contact: customer.contact,
                                  email: customer.email,
                                  vehicleTypeId: customer.vehicleTypeId,
                                  scrapCategory: customer.scrapCategory as any,
                                  address: customer.address,
                                  status: customer.status as any,
                                  totalOrders: customer.totalOrders || 0,
                                  totalSpent: customer.totalSpent || 0,
                                  lastOrderDate: customer.lastOrderDate ? new Date(customer.lastOrderDate) : undefined,
                                  createdAt: new Date(customer.createdAt),
                                  updatedAt: new Date(customer.updatedAt),
                                } as unknown as Customer;
                                setEditingCustomer(convertedCustomer);
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
                                handleDeleteCustomer(customer.id.toString());
                              }}
                              className="h-8 w-8 p-0 hover:bg-rose-50 text-rose-600 transition-all duration-200"
                            >
                              {deleteCustomerMutation.isPending ? (
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
                {filteredSortedCustomers.map((customer) => (
                  <div key={customer.id} className="rounded-lg border bg-card p-4 shadow-sm hover:shadow-lg transition-all duration-200 hover:bg-gradient-to-br hover:from-violet-50 hover:to-purple-50 cursor-pointer" onClick={() => setDetailsCustomer(customer)}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                      </div>
                      <StatusBadge status={customer.status} />
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Contact</div>
                      <div>{customer.contact}</div>
                      <div className="text-muted-foreground">Vehicle</div>
                      <div className="capitalize">{customer.vehicleType?.name || 'N/A'}</div>
                      <div className="text-muted-foreground">Category</div>
                      <div className="capitalize">{String(customer.scrapCategory || '').replace(/_/g, ' ')}</div>
                      <div className="text-muted-foreground">Orders</div>
                      <div>{customer.totalOrders || 0}</div>
                      <div className="text-muted-foreground">Total Spent</div>
                      <div>${(customer.totalSpent || 0).toLocaleString()}</div>
                      <div className="text-muted-foreground">Created</div>
                      <div>{formatDateHuman(customer.createdAt)}</div>
                    </div>
                    <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" onClick={() => setDetailsCustomer(customer)} className="hover:bg-indigo-50 text-indigo-600 transition-all duration-200">
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        const convertedCustomer: Customer = {
                          id: customer.id.toString(),
                          organizationId: customer.organizationId,
                          name: customer.name,
                          contact: customer.contact,
                          email: customer.email,
                          vehicleTypeId: customer.vehicleTypeId,
                          scrapCategory: customer.scrapCategory as any,
                          address: customer.address,
                          status: customer.status as any,
                          totalOrders: customer.totalOrders || 0,
                          totalSpent: customer.totalSpent || 0,
                          lastOrderDate: customer.lastOrderDate ? new Date(customer.lastOrderDate) : undefined,
                          createdAt: new Date(customer.createdAt),
                          updatedAt: new Date(customer.updatedAt),
                        } as unknown as Customer;
                        setEditingCustomer(convertedCustomer);
                        setIsFormOpen(true);
                      }} className="hover:bg-violet-50 text-violet-600 transition-all duration-200">
                        <Edit2 className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCustomer(customer.id.toString())} className="hover:bg-rose-50 text-rose-600 transition-all duration-200">
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
      <Button onClick={() => setIsFormOpen(true)} className="sm:hidden fixed bottom-6 right-6 rounded-full shadow-xl bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white transform hover:scale-110 transition-all duration-200 hover:shadow-2xl">
        <Plus className="mr-2 h-4 w-4" /> Add Customer
      </Button>

      {/* Quick View Dialog */}
      <Dialog open={!!detailsCustomer} onOpenChange={(open) => !open && setDetailsCustomer(null)}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>
          {detailsCustomer && (
            <div className="space-y-3">
              <div className="text-lg font-semibold">{detailsCustomer.name}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Contact</div>
                <div>{detailsCustomer.contact}</div>
                <div className="text-muted-foreground">Email</div>
                <div>{detailsCustomer.email}</div>
                <div className="text-muted-foreground">Address</div>
                <div>{detailsCustomer.address}</div>
                <div className="text-muted-foreground">Vehicle</div>
                <div className="capitalize">{detailsCustomer.vehicleType?.name || 'N/A'}</div>
                <div className="text-muted-foreground">Category</div>
                <div className="capitalize">{String(detailsCustomer.scrapCategory || '').replace(/_/g, ' ')}</div>
                <div className="text-muted-foreground">Status</div>
                <div><StatusBadge status={detailsCustomer.status} /></div>
                <div className="text-muted-foreground">Orders</div>
                <div>{detailsCustomer.totalOrders || 0}</div>
                <div className="text-muted-foreground">Total Spent</div>
                <div>${(detailsCustomer.totalSpent || 0).toLocaleString()}</div>
                <div className="text-muted-foreground">Last Order</div>
                <div>{detailsCustomer.lastOrderDate ? formatDateHuman(detailsCustomer.lastOrderDate) : 'Never'}</div>
                <div className="text-muted-foreground">Created</div>
                <div>{formatDateHuman(detailsCustomer.createdAt)}</div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button onClick={() => {
                  const convertedCustomer: Customer = {
                    id: detailsCustomer.id.toString(),
                    organizationId: detailsCustomer.organizationId,
                    name: detailsCustomer.name,
                    contact: detailsCustomer.contact,
                    email: detailsCustomer.email,
                    vehicleTypeId: detailsCustomer.vehicleTypeId,
                    scrapCategory: detailsCustomer.scrapCategory as any,
                    address: detailsCustomer.address,
                    status: detailsCustomer.status as any,
                    totalOrders: detailsCustomer.totalOrders || 0,
                    totalSpent: detailsCustomer.totalSpent || 0,
                    lastOrderDate: detailsCustomer.lastOrderDate ? new Date(detailsCustomer.lastOrderDate) : undefined,
                    createdAt: new Date(detailsCustomer.createdAt),
                    updatedAt: new Date(detailsCustomer.updatedAt),
                  } as unknown as Customer;
                  setEditingCustomer(convertedCustomer);
                  setIsFormOpen(true);
                }}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit
                </Button>
                <Button variant="outline" onClick={() => setDetailsCustomer(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CustomerForm
        customer={editingCustomer}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingCustomer(undefined);
        }}
      />
    </div>
  );
}
