'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmployeeForm } from '@/components/employee-form';
import { Employee } from '@/types';
import {
  Plus, Search, Edit2, Trash2, Loader2, Filter, X,
  Shield, UserCheck, UserX, User, ChevronDown, Phone, MoreHorizontal, Eye, UserPlus, Users, ArrowUpDown
} from 'lucide-react';
import { useEmployees, useDeleteEmployee, useUpdateEmployee, useEmployeeStats } from '@/hooks/use-employees';
import { useRoles, useDeleteRole, useUpdateRole, useCreateRole, useRoleStats } from '@/hooks/use-roles';
import { Role } from '@/lib/api/roles';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { employeesApi } from '@/lib/api';
import { Mail, MapPin, Calendar, Clock } from 'lucide-react';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';

// Dynamically import Lottie for better performance
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// No Data Animation Component
function NoDataAnimation({ message = 'No data found', description }: { message?: string; description?: string }) {
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
      </div>
    );
  }

  if (!animationData) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-gray-400 text-sm">{message}</div>
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
      <p className="mt-4 text-gray-600 text-sm font-medium">{message}</p>
      {description && <p className="mt-1 text-gray-400 text-xs">{description}</p>}
    </div>
  );
}

// Employee Avatar Component - Minimalistic
function EmployeeAvatar({ name, className = '' }: { name: string; className?: string }) {
  const firstLetter = (name || 'U').charAt(0).toUpperCase();
  return (
    <div className={cn(
      "w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm hover:shadow-md transition-all",
      className
    )}>
      <span className="text-primary-foreground font-semibold leading-none text-sm">
        {firstLetter}
      </span>
    </div>
  );
}

// Employee Profile View Dialog Component - Customer Profile Inspired
function EmployeeProfileDialog({
  employee,
  isOpen,
  onClose,
  returnTo
}: {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  returnTo?: string;
}) {
  const router = useRouter();

  if (!employee) return null;

  const handleClose = () => {
    onClose();
    if (returnTo) {
      router.push(returnTo);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent
        className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col p-0"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideClose={true}
      >
        {/* Header - Minimal White */}
        <div className="px-8 py-6 border-b border-border bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Employee Profile</h2>
              <p className="text-sm text-muted-foreground mt-1">View employee details and information</p>
            </div>
          </div>
        </div>

        {/* Content Area - Form Style */}
        <div className="flex-1 overflow-y-auto px-8 py-6 bg-white">
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Personal Information</h3>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                    Full Name *
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-lg border border-border">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{employee.fullName}</span>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                    Phone *
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-lg border border-border">
                    <Phone className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{employee.phone || 'Not provided'}</span>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                    Email *
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-lg border border-border">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{employee.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Role & Security Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Role & Security</h3>
              </div>

              <div className="space-y-4">
                {/* Role */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                    Role *
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-lg border border-border">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {(employee as any).role?.name || employee.role || 'No role assigned'}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                    Status
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-lg border border-border">
                    {employee.isActive ? (
                      <UserCheck className="h-4 w-4 text-green-600" />
                    ) : (
                      <UserX className="h-4 w-4 text-gray-500" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      employee.isActive ? "text-green-600" : "text-gray-500"
                    )}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Joined Date */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">
                    Joined Date
                  </label>
                  <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-lg border border-border">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {new Date(employee.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Simple */}
        <div className="flex justify-end items-center px-8 py-4 border-t border-border bg-white">
          <Button
            onClick={handleClose}
            className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-2 rounded-lg transition-colors"
          >
            {returnTo ? 'Back to Orders' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Status Badge Component
function StatusBadge({ status, showDropdownIcon = false }: { status: string; showDropdownIcon?: boolean }) {
  const isActive = status.toUpperCase() === 'ACTIVE' || status.toUpperCase() === 'AUTHORIZED';
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

type MainTabKey = 'employees' | 'roles';
type StatusTabKey = 'all' | 'active' | 'inactive';

export default function EmployeesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<MainTabKey>('employees');

  // Employees state
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [debouncedEmployeeSearch, setDebouncedEmployeeSearch] = useState('');
  const [employeePage, setEmployeePage] = useState(1);
  const [employeeLimit, setEmployeeLimit] = useState(10);
  const [employeeStatusFilter, setEmployeeStatusFilter] = useState<StatusTabKey>('all');
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();

  // Roles state
  const [roleSearch, setRoleSearch] = useState('');
  const [debouncedRoleSearch, setDebouncedRoleSearch] = useState('');
  const [rolePage, setRolePage] = useState(1);
  const [roleLimit, setRoleLimit] = useState(10);
  const [roleStatusFilter, setRoleStatusFilter] = useState<StatusTabKey>('all');
  const [isRoleFormOpen, setIsRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>();
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  // UI State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Employee Profile View State
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [isProfileViewOpen, setIsProfileViewOpen] = useState(false);

  // Delete Confirmation State
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteData, setDeleteData] = useState<{
    id: string;
    type: 'employee' | 'role';
    title: string;
    itemTitle: string;
    itemSubtitle?: string;
    icon?: React.ReactNode;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle view parameter from URL
  useEffect(() => {
    const viewId = searchParams.get('view');
    const returnTo = searchParams.get('returnTo');

    if (viewId) {
      const fetchAndViewEmployee = async () => {
        try {
          const response = await employeesApi.getEmployee(viewId);
          if (response.data) {
            setViewingEmployee(response.data);
            setIsProfileViewOpen(true);

            // Clean up URL after opening dialog
            const newSearchParams = new URLSearchParams(searchParams.toString());
            newSearchParams.delete('view');
            const newUrl = newSearchParams.toString()
              ? `${window.location.pathname}?${newSearchParams.toString()}`
              : window.location.pathname;
            router.replace(newUrl);
          }
        } catch (e) {
          console.error('Failed to fetch employee for viewing', e);
          toast.error('Failed to load employee profile');
        }
      };
      fetchAndViewEmployee();
    }
  }, [searchParams, router]);

  // Debounce searches
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmployeeSearch(employeeSearch);
      setEmployeePage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [employeeSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRoleSearch(roleSearch);
      setRolePage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [roleSearch]);

  // Queries
  const { data: employeesData, isLoading: employeesLoading, error: employeesError, refetch: refetchEmployees } = useEmployees({
    page: employeePage,
    limit: employeeLimit,
    search: debouncedEmployeeSearch || undefined,
    isActive: employeeStatusFilter === 'all' ? undefined : employeeStatusFilter === 'active'
  } as any);

  const { data: employeeStats } = useEmployeeStats();

  const { data: rolesData, isLoading: rolesLoading, error: rolesError, refetch: refetchRoles } = useRoles({
    page: rolePage,
    limit: roleLimit,
    search: debouncedRoleSearch || undefined,
    status: roleStatusFilter === 'all' ? null : (roleStatusFilter === 'active' ? true : false)
  });

  const { data: roleStats } = useRoleStats();

  // Mutations
  const deleteEmployeeMutation = useDeleteEmployee();
  const updateEmployeeMutation = useUpdateEmployee();

  const deleteRoleMutation = useDeleteRole();
  const updateRoleMutation = useUpdateRole();
  const createRoleMutation = useCreateRole();

  // Data processing
  const employees = useMemo(() => employeesData?.data?.employees || [], [employeesData]);
  const employeePagination = useMemo(() => employeesData?.data?.pagination || {
    page: 1, limit: 10, total: 0, totalPages: 0
  }, [employeesData]);

  const roles = useMemo(() => (rolesData as any)?.data?.roles || [], [rolesData]);
  const rolePagination = useMemo(() => (rolesData as any)?.data?.pagination || {
    page: 1, limit: 10, total: 0, totalPages: 0
  }, [rolesData]);

  // Handlers
  const handleDeleteEmployee = (id: string) => {
    const employee = employees.find((e: Employee) => e.id === id);
    if (employee) {
      setDeleteData({
        id,
        type: 'employee',
        title: 'Delete Employee',
        itemTitle: employee.fullName,
        itemSubtitle: employee.email,
        icon: <EmployeeAvatar name={employee.fullName} />
      });
      setIsDeleteConfirmOpen(true);
    }
  };

  const handleToggleEmployeeStatus = async (employee: Employee, value: string) => {
    try {
      const newActiveStatus = value.toUpperCase() === 'ACTIVE';
      if (employee.isActive === newActiveStatus) return;

      await updateEmployeeMutation.mutateAsync({
        id: employee.id,
        data: { isActive: newActiveStatus }
      });
      toast.success(`Employee ${newActiveStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteRole = (id: string) => {
    const role = roles.find((r: Role) => r.id.toString() === id);
    if (role) {
      setDeleteData({
        id,
        type: 'role',
        title: 'Delete Role',
        itemTitle: role.name,
        itemSubtitle: `${(role as any)._count?.employees || 0} Members`,
        icon: (
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shadow-sm border border-purple-100">
            <Shield className="h-5 w-5 text-purple-600" />
          </div>
        )
      });
      setIsDeleteConfirmOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteData) return;
    try {
      if (deleteData.type === 'employee') {
        await deleteEmployeeMutation.mutateAsync(deleteData.id);
        toast.success('Employee deleted successfully');
      } else {
        await deleteRoleMutation.mutateAsync(deleteData.id);
        toast.success('Role deleted successfully');
      }
      setIsDeleteConfirmOpen(false);
      setDeleteData(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Failed to delete ${deleteData.type}`);
    }
  };

  const handleToggleRoleStatus = async (role: Role) => {
    try {
      await updateRoleMutation.mutateAsync({
        id: role.id.toString(),
        data: { isActive: !role.isActive }
      });
      toast.success(`Role ${role.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      toast.error('Failed to update role status');
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await updateRoleMutation.mutateAsync({
          id: editingRole.id.toString(),
          data: roleFormData
        });
        toast.success('Role updated successfully');
      } else {
        await createRoleMutation.mutateAsync(roleFormData);
        toast.success('Role created successfully');
      }
      setIsRoleFormOpen(false);
      setEditingRole(undefined);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save role');
    }
  };

  useEffect(() => {
    if (isRoleFormOpen && editingRole) {
      setRoleFormData({
        name: editingRole.name,
        description: editingRole.description || '',
        isActive: editingRole.isActive ?? true,
      });
    } else if (isRoleFormOpen && !editingRole) {
      setRoleFormData({
        name: '',
        description: '',
        isActive: true,
      });
    }
  }, [isRoleFormOpen, editingRole]);

  const currentSearch = activeTab === 'employees' ? employeeSearch : roleSearch;
  const setCurrentSearch = activeTab === 'employees' ? setEmployeeSearch : setRoleSearch;

  if (employeesError || rolesError) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading data</h2>
          <Button onClick={() => activeTab === 'employees' ? refetchEmployees() : refetchRoles()} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-xl font-bold text-gray-900">Employee Management</CardTitle>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Main Tab Switcher */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setActiveTab('employees');
                    setIsSearchOpen(false);
                  }}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'employees'
                    ? 'bg-white text-cyan-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Employees
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${activeTab === 'employees'
                    ? 'bg-cyan-100 text-cyan-700'
                    : 'bg-gray-200 text-gray-600'
                    }`}>
                    {employeeStats?.total ?? 0}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('roles');
                    setIsSearchOpen(false);
                  }}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'roles'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Roles
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${activeTab === 'roles'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-200 text-gray-600'
                    }`}>
                    {roleStats?.total ?? 0}
                  </span>
                </button>
              </div>

              {/* Standardized Search Bar */}
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
                    value={currentSearch}
                    onChange={(e) => setCurrentSearch(e.target.value)}
                    onBlur={() => {
                      if (!currentSearch) setIsSearchOpen(false);
                    }}
                    autoFocus
                    className="w-64 pl-10 pr-10 rounded-lg border-gray-200 focus:border-cyan-500 focus:ring-cyan-500"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                  {currentSearch && (
                    <button
                      onClick={() => {
                        setCurrentSearch('');
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
                onClick={() => {
                  if (activeTab === 'employees') {
                    setEditingEmployee(undefined);
                    setIsEmployeeFormOpen(true);
                  } else {
                    setEditingRole(undefined);
                    setIsRoleFormOpen(true);
                  }
                }}
                className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 w-9 p-0"
                title={activeTab === 'employees' ? 'Add Employee' : 'Add Role'}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {!mounted ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-white">
                  {/* Status Tabs Row */}
                  <TableRow className="hover:bg-transparent border-b-2 border-gray-200 bg-gray-50/50">
                    <TableHead colSpan={activeTab === 'employees' ? 7 : 4} className="p-0 bg-transparent h-auto">
                      <div className="w-full overflow-x-auto">
                        <div className="inline-flex items-center gap-1 px-6 py-3">
                          {(['all', 'active', 'inactive'] as StatusTabKey[]).map((status) => {
                            const isCurrentStatus = activeTab === 'employees' ? employeeStatusFilter === status : roleStatusFilter === status;
                            let count = 0;
                            if (activeTab === 'employees') {
                              if (status === 'all') count = employeeStats?.total ?? 0;
                              else if (status === 'active') count = employeeStats?.active ?? 0;
                              else count = employeeStats?.inactive ?? 0;
                            } else {
                              if (status === 'all') count = roleStats?.total ?? 0;
                              else if (status === 'active') count = roleStats?.active ?? 0;
                              else count = roleStats?.inactive ?? 0;
                            }

                            const colorClasses = activeTab === 'employees' ? {
                              activeText: 'text-cyan-700',
                              activeBg: 'bg-cyan-50',
                              underline: 'bg-cyan-500',
                              count: 'bg-cyan-100 text-cyan-700'
                            } : {
                              activeText: 'text-purple-700',
                              activeBg: 'bg-purple-50',
                              underline: 'bg-purple-500',
                              count: 'bg-purple-100 text-purple-700'
                            };

                            return (
                              <button
                                key={status}
                                onClick={() => {
                                  if (activeTab === 'employees') {
                                    setEmployeeStatusFilter(status);
                                    setEmployeePage(1);
                                  } else {
                                    setRoleStatusFilter(status);
                                    setRolePage(1);
                                  }
                                }}
                                className={`relative px-4 py-2 text-sm font-medium transition-all rounded-t-md ${isCurrentStatus
                                  ? `${colorClasses.activeText} ${colorClasses.activeBg} shadow-sm`
                                  : 'text-gray-600 hover:bg-gray-100'
                                  }`}
                              >
                                <span className="inline-flex items-center gap-2 capitalize">
                                  {status}
                                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${colorClasses.count}`}>
                                    {count}
                                  </span>
                                </span>
                                {isCurrentStatus && (
                                  <span className={`absolute left-0 right-0 -bottom-0.5 h-0.5 ${colorClasses.underline} rounded`} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </TableHead>
                  </TableRow>

                  {/* Column Headers */}
                  <TableRow className="hover:bg-transparent border-b bg-white">
                    <TableHead className="w-12">
                      <Checkbox className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" />
                    </TableHead>
                    {activeTab === 'employees' ? (
                      <>
                        <TableHead className="font-semibold text-gray-900 text-sm py-4">Employee</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-sm py-4">Contact</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-sm py-4">Role</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-sm py-4">Work Zone</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-sm py-4">Status</TableHead>
                      </>
                    ) : (
                      <>
                        <TableHead className="font-semibold text-gray-900 text-sm py-4">Role Identity</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-sm py-4">Users Linked</TableHead>
                        <TableHead className="font-semibold text-gray-900 text-sm py-4">System Status</TableHead>
                      </>
                    )}
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {activeTab === 'employees' ? (
                    employeesLoading ? (
                      Array.from({ length: employeeLimit }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : employees.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-12"><NoDataAnimation message="No employees found" /></TableCell></TableRow>
                    ) : (
                      employees.map((employee: Employee) => (
                        <TableRow key={employee.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell><Checkbox className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" /></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <EmployeeAvatar name={employee.fullName} />
                              <div className="flex flex-col text-left">
                                <span className="font-semibold text-gray-900">{employee.fullName}</span>
                                <span className="text-xs text-gray-500">Joined {new Date(employee.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-left">
                              <div className="flex items-center gap-1.5 text-sm text-gray-700">
                                <Phone className="w-3 h-3 text-cyan-600" /> {employee.phone}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <User className="w-3 h-3 text-gray-400" /> {employee.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700">
                              {(employee as any).role?.name || employee.role || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">{(employee as any).scrapYard?.yardName || (employee as any).scrapYard?.name || employee.workZone || 'Not specified'}</span>
                          </TableCell>
                          <TableCell>
                            <Select value={employee.isActive ? 'Active' : 'Inactive'} onValueChange={(v) => handleToggleEmployeeStatus(employee, v)}>
                              <SelectTrigger className="h-auto w-auto p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 shadow-none">
                                <StatusBadge status={employee.isActive ? 'Active' : 'Inactive'} showDropdownIcon={true} />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white">
                                <DropdownMenuItem onClick={() => { setEditingEmployee(employee); setIsEmployeeFormOpen(true); }} className="cursor-pointer">
                                  <Edit2 className="mr-2 h-4 w-4 text-cyan-600" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteEmployee(employee.id)} className="text-red-600 cursor-pointer">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  ) : (
                    rolesLoading ? (
                      Array.from({ length: roleLimit }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                          <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                        </TableRow>
                      ))
                    ) : roles.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-12"><NoDataAnimation message="No roles found" /></TableCell></TableRow>
                    ) : (
                      roles.map((role: Role) => (
                        <TableRow key={role.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell><Checkbox className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500" /></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shadow-sm border border-white">
                                <Shield className="h-5 w-5 text-gray-600" />
                              </div>
                              <span className="font-semibold text-gray-900 text-sm">{role.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-bold text-gray-700">{role._count?.employees || 0} Members</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div onClick={() => handleToggleRoleStatus(role)} className="cursor-pointer">
                              <StatusBadge status={role.isActive ? 'AUTHORIZED' : 'DEACTIVATED'} />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white">
                                <DropdownMenuItem onClick={() => { setEditingRole(role); setIsRoleFormOpen(true); }} className="cursor-pointer">
                                  <Edit2 className="mr-2 h-4 w-4 text-purple-600" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteRole(role.id.toString())} className="text-red-600 cursor-pointer">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
            <RowsPerPage
              value={activeTab === 'employees' ? employeeLimit : roleLimit}
              onChange={(value) => {
                if (activeTab === 'employees') { setEmployeeLimit(value); setEmployeePage(1); }
                else { setRoleLimit(value); setRolePage(1); }
              }}
              options={[5, 10, 20, 50]}
            />
            <div className="text-xs text-gray-500 font-medium">
              Showing {activeTab === 'employees'
                ? `${((employeePagination.page - 1) * employeePagination.limit) + 1} to ${Math.min(employeePagination.page * employeePagination.limit, employeePagination.total)} of ${employeePagination.total} employees`
                : `${((rolePagination.page - 1) * rolePagination.limit) + 1} to ${Math.min(rolePagination.page * rolePagination.limit, rolePagination.total)} of ${rolePagination.total} roles`
              }
            </div>
            <Pagination
              currentPage={activeTab === 'employees' ? employeePagination.page : rolePagination.page}
              totalPages={activeTab === 'employees' ? employeePagination.totalPages : rolePagination.totalPages}
              onPageChange={(p) => activeTab === 'employees' ? setEmployeePage(p) : setRolePage(p)}
            />
          </div>
        </CardContent>
      </Card>

      <EmployeeForm
        employee={editingEmployee}
        isOpen={isEmployeeFormOpen}
        onClose={() => {
          setIsEmployeeFormOpen(false);
          setEditingEmployee(undefined);
        }}
      />

      {/* Role Dialog */}
      <Dialog open={isRoleFormOpen} onOpenChange={setIsRoleFormOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRoleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name *</Label>
              <Input
                id="role-name"
                value={roleFormData.name}
                onChange={(e) => setRoleFormData({ ...roleFormData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-desc">Description</Label>
              <Input
                id="role-desc"
                value={roleFormData.description}
                onChange={(e) => setRoleFormData({ ...roleFormData, description: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRoleFormOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <EmployeeProfileDialog
        employee={viewingEmployee}
        isOpen={isProfileViewOpen}
        onClose={() => {
          setIsProfileViewOpen(false);
          setViewingEmployee(null);
        }}
        returnTo={searchParams.get('returnTo') || undefined}
      />

      {/* Reusable Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setDeleteData(null);
        }}
        onConfirm={handleConfirmDelete}
        title={deleteData?.title}
        description={`Are you sure you want to delete this ${deleteData?.type}? This action cannot be undone and will permanently remove the record from the system.`}
        confirmText={`Delete ${deleteData?.type === 'employee' ? 'Employee' : 'Role'}`}
        isLoading={deleteData?.type === 'employee' ? deleteEmployeeMutation.isPending : deleteRoleMutation.isPending}
        itemTitle={deleteData?.itemTitle}
        itemSubtitle={deleteData?.itemSubtitle}
        icon={deleteData?.icon}
      />
    </div>
  );
}