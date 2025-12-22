'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmployeeForm } from '@/components/employee-form';
import { Employee } from '@/types';
import {
  Plus, Search, Edit2, Trash2, Loader2, Filter, X,
  Shield, UserCheck, UserX, User, ChevronDown, Phone, MoreHorizontal, Eye, UserPlus
} from 'lucide-react';
import { useEmployees, useDeleteEmployee, useUpdateEmployee } from '@/hooks/use-employees';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn, formatDateDDMMYYYY } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { employeesApi } from '@/lib/api';
import { Mail, MapPin, Calendar, Clock } from 'lucide-react';

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
        <div className="text-gray-400 text-sm">No employees found</div>
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
      <p className="mt-4 text-gray-600 text-sm font-medium">No employees found</p>
      <p className="mt-1 text-gray-400 text-xs">Try adjusting your filters or add a new employee</p>
    </div>
  );
}

// Employee Avatar Component
function EmployeeAvatar({ name, className = '' }: { name: string; className?: string }) {
  const firstLetter = (name || 'U').charAt(0).toUpperCase();
  return (
    <div className={cn(
      "w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-300",
      className
    )}>
      <span className="text-white font-semibold leading-none text-sm">
        {firstLetter}
      </span>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status, showDropdownIcon = false }: { status: string; showDropdownIcon?: boolean }) {
  const isActive = status.toUpperCase() === 'ACTIVE';
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300",
      isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
    )}>
      {isActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
      {status}
      {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 flex-shrink-0" />}
    </span>
  );
}

// Tab styling
type TabKey = 'All' | 'Admin' | 'Manager' | 'Collector' | 'Supervisor';
function getTabStyle(tab: TabKey, activeTab: string) {
  const isActive = activeTab === tab;
  // Base styles
  const base = "relative px-4 py-2 text-sm font-medium transition-all rounded-t-md";
  const inactive = "text-gray-600 hover:bg-gray-100 hover:text-gray-900";

  // Active styles per tab
  switch (tab) {
    case 'All':
      return isActive ? `${base} text-cyan-700 bg-cyan-50 shadow-sm` : `${base} ${inactive}`;
    case 'Admin':
      return isActive ? `${base} text-purple-700 bg-purple-50 shadow-sm` : `${base} ${inactive}`;
    case 'Manager':
      return isActive ? `${base} text-blue-700 bg-blue-50 shadow-sm` : `${base} ${inactive}`;
    case 'Collector':
      return isActive ? `${base} text-green-700 bg-green-50 shadow-sm` : `${base} ${inactive}`;
    case 'Supervisor':
      return isActive ? `${base} text-orange-700 bg-orange-50 shadow-sm` : `${base} ${inactive}`;
    default:
      return isActive ? `${base} text-primary bg-muted shadow-sm` : `${base} ${inactive}`;
  }
}

function getTabUnderline(tab: TabKey) {
  switch (tab) {
    case 'All': return 'bg-cyan-500';
    case 'Admin': return 'bg-purple-600';
    case 'Manager': return 'bg-blue-600';
    case 'Collector': return 'bg-green-600';
    case 'Supervisor': return 'bg-orange-600';
    default: return 'bg-primary';
  }
}

function getTabCountStyle(tab: TabKey) {
  switch (tab) {
    case 'All': return 'bg-cyan-100 text-cyan-700';
    case 'Admin': return 'bg-purple-100 text-purple-700';
    case 'Manager': return 'bg-blue-100 text-blue-700';
    case 'Collector': return 'bg-green-100 text-green-700';
    case 'Supervisor': return 'bg-orange-100 text-orange-700';
    default: return 'bg-muted text-foreground';
  }
}

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeTab, setActiveTab] = useState<TabKey>('All');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // UI State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());

  // Sorting (Managed locally for now or pass to API if supported)
  const [sortKey, setSortKey] = useState<'fullName' | 'createdAt'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [detailsEmployee, setDetailsEmployee] = useState<Employee | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Close handler that checks for returnTo URL
  const handleCloseDetails = () => {
    setDetailsEmployee(null);
    const returnTo = searchParams.get('returnTo');
    if (returnTo) {
      router.push(returnTo);
    }
  };

  // Handle view parameter from URL to show employee details
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId) {
      const fetchEmployeeAndShow = async () => {
        try {
          const response = await employeesApi.getEmployee(viewId);
          if (response.data) {
            setDetailsEmployee(response.data as any);
          }
        } catch (error) {
          console.error('Error fetching employee for view:', error);
          toast.error('Failed to load employee details');
        } finally {
          // Remove view parameter from URL
          const newSearchParams = new URLSearchParams(searchParams.toString());
          newSearchParams.delete('view');
          const newUrl = newSearchParams.toString()
            ? `${window.location.pathname}?${newSearchParams.toString()}`
            : window.location.pathname;
          router.replace(newUrl);
        }
      };
      fetchEmployeeAndShow();
    }
  }, [searchParams, router]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const queryParams = useMemo(() => {
    return {
      page,
      limit,
      search: debouncedSearchTerm || undefined,
      role: activeTab === 'All' ? undefined : activeTab.toLowerCase(),
      isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE'
    };
  }, [page, limit, debouncedSearchTerm, activeTab, statusFilter]);

  // Fetch employees from API
  const { data: employeesData, isLoading, error, refetch } = useEmployees(queryParams as any);

  const deleteEmployeeMutation = useDeleteEmployee();
  const updateEmployeeMutation = useUpdateEmployee();

  // Extract employees and pagination
  const employees = useMemo(() => {
    return employeesData?.data?.employees || [];
  }, [employeesData]);

  const pagination = useMemo(() => {
    return employeesData?.data?.pagination || {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    };
  }, [employeesData]);

  // Calculate counts for tabs (this might need a separate API call or be approximate based on loaded data if API doesn't return all counts)
  // Since we don't have a specific stats hook that covers all roles in one go shown here (except maybe useEmployeeStats), 
  // and we are paginating, we might not have accurate counts for tabs unless we fetch them. 
  // For now we will hide counts or just show them if we have them. 
  // Let's rely on pagination.total for the current tab.

  const handleDeleteEmployee = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployeeMutation.mutateAsync(id);
        toast.success('Employee deleted successfully');
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete employee';
        toast.error(errorMessage);
      }
    }
  };

  const onInlineStatusChange = async (employee: Employee, value: string) => {
    try {
      const newActiveStatus = value.toUpperCase() === 'ACTIVE';
      if (employee.isActive === newActiveStatus) return;

      await updateEmployeeMutation.mutateAsync({
        id: employee.id,
        data: { isActive: newActiveStatus }
      });
      toast.success(`Employee ${newActiveStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update status';
      toast.error(errorMessage);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(new Set(employees.map(e => e.id)));
    } else {
      setSelectedEmployees(new Set());
    }
  };

  const handleSelectEmployee = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedEmployees);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedEmployees(newSelected);
  };

  const isAllSelected = employees.length > 0 && selectedEmployees.size === employees.length;

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading employees</h2>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Employee List Card */}
      <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-xl font-bold text-gray-900">Employees</CardTitle>

            <div className="flex items-center gap-2">
              {/* Search Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-gray-900 active:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed h-9 w-9 p-0"
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

              {/* Filter Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-gray-900 active:bg-gray-200 transition-all h-9 w-9 p-0 ${statusFilter !== 'ALL' ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : ''
                  } ${isFilterOpen ? 'border-cyan-500 bg-cyan-50' : ''}`}
              >
                <Filter className={`h-4 w-4 ${statusFilter !== 'ALL' ? 'text-cyan-700' : ''}`} />
              </Button>

              <Button
                onClick={() => {
                  setEditingEmployee(undefined);
                  setIsFormOpen(true);
                }}
                className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 w-9 p-0"
                title="Add Employee"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Filter Panel */}
          {isFilterOpen && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by Status:</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(v: any) => {
                      setStatusFilter(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className={`w-[200px] bg-white border-gray-200 hover:border-gray-300 transition-all ${statusFilter !== 'ALL' ? 'border-cyan-500 ring-2 ring-cyan-200' : ''
                      }`}>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Statuses</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  {statusFilter !== 'ALL' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStatusFilter('ALL')}
                      className="h-8 px-2 text-gray-500 hover:text-gray-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFilterOpen(false)}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading employees...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto hidden sm:block">
                <Table>
                  <TableHeader className="bg-white">
                    {/* Tabs Row */}
                    <TableRow className="hover:bg-transparent border-b-2 border-gray-200 bg-gray-50">
                      <TableHead colSpan={7} className="p-0 bg-transparent">
                        <div className="w-full overflow-x-auto">
                          <div className="inline-flex items-center gap-1 px-2 py-2">
                            {(['All', 'Admin', 'Manager', 'Collector', 'Supervisor'] as const).map((tab) => {
                              const isActive = activeTab === tab;
                              const underlineClass = getTabUnderline(tab);
                              const countStyle = getTabCountStyle(tab);

                              return (
                                <button
                                  key={tab}
                                  onClick={() => {
                                    setActiveTab(tab);
                                    setPage(1);
                                  }}
                                  className={getTabStyle(tab, activeTab)}
                                >
                                  <span className="inline-flex items-center gap-2">
                                    {tab}
                                    {/* Count badge is optional/hidden if not available, or could be passed. 
                                                                 For now hiding to avoid incorrect 0s until we have stats data */
                                      isActive && (
                                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${countStyle}`}>
                                          {pagination.total}
                                        </span>
                                      )}
                                  </span>
                                  {isActive && <span className={`absolute left-0 right-0 -bottom-0.5 h-0.5 ${underlineClass} rounded`} />}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </TableHead>
                    </TableRow>

                    <TableRow className="hover:bg-transparent border-b bg-white">
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                        />
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900 text-sm py-4">Employee</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-sm py-4">Contact</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-sm py-4">Role</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-sm py-4">Work Zone</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-sm py-4">Status</TableHead>
                      <TableHead className="text-right pr-6 font-semibold text-gray-900 text-sm py-4">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <NoDataAnimation />
                        </TableCell>
                      </TableRow>
                    ) : (
                      employees.map((employee) => {
                        const roleName = (employee as any).role?.name || employee.role || 'Unknown';
                        const workZoneName = (employee as any).scrapYard?.yardName || (employee as any).scrapYard?.name || employee.workZone || 'Not specified';

                        return (
                          <TableRow key={employee.id} className="hover:bg-gray-50 transition-colors">
                            <TableCell>
                              <Checkbox
                                checked={selectedEmployees.has(employee.id)}
                                onCheckedChange={(checked) => handleSelectEmployee(employee.id, checked as boolean)}
                                className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <EmployeeAvatar name={employee.fullName} />
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-900">{employee.fullName}</span>
                                  <span className="text-xs text-gray-500">Joined {new Date(employee.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                  <span className="w-4 h-4 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-2.5 h-2.5 text-cyan-600" />
                                  </span>
                                  {employee.phone}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <span className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <User className="w-2.5 h-2.5 text-gray-500" />
                                  </span>
                                  {employee.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700">
                                {roleName}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-gray-600">{workZoneName}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={employee.isActive ? 'Active' : 'Inactive'}
                                  onValueChange={(v) => onInlineStatusChange(employee, v)}
                                >
                                  <SelectTrigger className="h-auto w-auto p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none max-w-none min-w-0 overflow-visible">
                                    <div className="flex items-center">
                                      <StatusBadge status={employee.isActive ? 'Active' : 'Inactive'} showDropdownIcon={true} />
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
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditingEmployee(employee);
                                      setIsFormOpen(true);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Edit2 className="mr-2 h-4 w-4 text-cyan-600" />
                                    <span>Edit</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteEmployee(employee.id)}
                                    className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
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
                  {pagination.total} employees
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

      <EmployeeForm
        employee={editingEmployee}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEmployee(undefined);
        }}
      />

      {/* Employee Quick View Dialog */}
      <Dialog open={!!detailsEmployee} onOpenChange={(open) => !open && handleCloseDetails()}>
        <DialogContent className="sm:max-w-[550px] border-none shadow-2xl bg-white p-0 overflow-hidden">
          {(() => {
            const role = ((detailsEmployee as any)?.role?.name || detailsEmployee?.role || 'staff').toLowerCase();
            const colors = {
              admin: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-100', icon: 'text-purple-600' },
              manager: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: 'text-blue-600' },
              collector: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100', icon: 'text-cyan-600' },
              supervisor: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100', icon: 'text-orange-600' },
              staff: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-100', icon: 'text-gray-600' }
            }[role] || { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100', icon: 'text-cyan-600' };

            return (
              <>
                <DialogHeader className="p-5 border-b border-gray-100 flex flex-row items-center justify-between space-y-0">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-sm",
                      role === 'admin' ? 'bg-purple-500' :
                        role === 'manager' ? 'bg-blue-500' :
                          role === 'collector' ? 'bg-cyan-500' :
                            role === 'supervisor' ? 'bg-orange-500' : 'bg-gray-500'
                    )}>
                      {(detailsEmployee?.fullName || 'E').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <DialogTitle className="text-xl font-bold text-gray-900">{detailsEmployee?.fullName}</DialogTitle>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={cn("border-none px-2 py-0 text-[10px] uppercase font-bold tracking-wider", colors.bg, colors.text)}>
                          {role}
                        </Badge>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">• {detailsEmployee?.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCloseDetails}
                      className="h-9 border-gray-200 text-gray-600 font-bold text-[10px] uppercase px-4 hover:bg-gray-50 hover:text-red-500 transition-colors"
                    >
                      Close
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingEmployee(detailsEmployee!);
                        setIsFormOpen(true);
                        setDetailsEmployee(null);
                      }}
                      className={cn("h-9 text-white font-bold text-[10px] uppercase px-4 shadow-md transition-transform active:scale-95",
                        role === 'admin' ? 'bg-purple-600 hover:bg-purple-700' :
                          role === 'manager' ? 'bg-blue-600 hover:bg-blue-700' :
                            role === 'collector' ? 'bg-cyan-600 hover:bg-cyan-700' :
                              role === 'supervisor' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-900 hover:bg-black'
                      )}
                    >
                      Edit Info
                    </Button>
                  </div>
                </DialogHeader>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={cn("p-4 rounded-xl border transition-all hover:shadow-md", colors.bg, colors.border)}>
                      <div className="flex items-center gap-3 mb-2">
                        <Phone className={cn("h-4 w-4", colors.icon)} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Mobile Number</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 ml-7">{detailsEmployee?.phone || 'Not provided'}</p>
                    </div>

                    <div className={cn("p-4 rounded-xl border transition-all hover:shadow-md", colors.bg, colors.border)}>
                      <div className="flex items-center gap-3 mb-2">
                        <Mail className={cn("h-4 w-4", colors.icon)} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email Address</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 ml-7 truncate">{detailsEmployee?.email || 'Not provided'}</p>
                    </div>

                    <div className={cn("p-4 rounded-xl border transition-all hover:shadow-md sm:col-span-2", colors.bg, colors.border)}>
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className={cn("h-4 w-4", colors.icon)} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Work Location / Primary Yard</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 ml-7 uppercase">
                        {(detailsEmployee as any)?.scrapYard?.yardName || (detailsEmployee as any)?.scrapYard?.name || detailsEmployee?.workZone || 'General Operations'}
                      </p>
                    </div>

                    <div className={cn("p-4 rounded-xl border transition-all hover:shadow-md sm:col-span-2", colors.bg, colors.border)}>
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className={cn("h-4 w-4", colors.icon)} />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">System Registration Date</span>
                      </div>
                      <div className="flex items-center justify-between ml-7">
                        <p className="text-sm font-bold text-gray-900">
                          {detailsEmployee?.createdAt ? new Date(detailsEmployee.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase">
                          <Clock className="h-3 w-3" />
                          Joined {detailsEmployee?.createdAt ? new Date(detailsEmployee.createdAt).getHours() % 12 || 12 : '0'}:{detailsEmployee?.createdAt ? new Date(detailsEmployee.createdAt).getMinutes().toString().padStart(2, '0') : '00'} {detailsEmployee?.createdAt && new Date(detailsEmployee.createdAt).getHours() >= 12 ? 'PM' : 'AM'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}