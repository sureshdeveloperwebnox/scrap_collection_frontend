'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRoles, useDeleteRole, useUpdateRole, useCreateRole } from '@/hooks/use-roles';
import { Role } from '@/lib/api/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, AlertCircle, Shield, X, Filter, Check, Loader2, Truck, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

type SortKey = 'name' | 'isActive';

interface ApiResponse {
  data: {
    roles: Role[];
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

export default function RolesPage() {
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // UI State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch roles
  const { data: rolesData, isLoading, error, refetch } = useRoles({
    page,
    limit,
    search: debouncedSearchTerm || undefined,
    status: isActiveFilter,
    sortBy,
    sortOrder,
  });

  // Mutations
  const deleteRoleMutation = useDeleteRole();
  const updateRoleMutation = useUpdateRole();
  const createRoleMutation = useCreateRole();

  // Handle API response structure
  const apiResponse = rolesData as unknown as ApiResponse;
  const roles = useMemo(() => apiResponse?.data?.roles || [], [apiResponse]);
  const pagination = useMemo(() => apiResponse?.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  }, [apiResponse]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isFormOpen && editingRole) {
      setFormData({
        name: editingRole.name,
        description: editingRole.description || '',
        isActive: editingRole.isActive ?? true,
      });
    } else if (isFormOpen && !editingRole) {
      setFormData({
        name: '',
        description: '',
        isActive: true,
      });
    }
  }, [isFormOpen, editingRole]);

  const handleCreate = () => {
    setEditingRole(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      try {
        await deleteRoleMutation.mutateAsync(id);
        toast.success('Role deleted successfully');
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to delete role';
        toast.error(errorMessage);
      }
    }
  };

  const handleToggleStatus = async (role: Role) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingRole) {
        await updateRoleMutation.mutateAsync({
          id: editingRole.id.toString(),
          data: formData
        });
        toast.success('Role updated successfully');
      } else {
        await createRoleMutation.mutateAsync(formData);
        toast.success('Role created successfully');
      }

      setIsFormOpen(false);
      setEditingRole(undefined);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to save role';
      toast.error(errorMessage);
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

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading roles</h2>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  const formLoading = updateRoleMutation.isPending || createRoleMutation.isPending;

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-xl shadow-gray-200/50 border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300">
        <CardHeader className="pb-4 bg-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
                System Access Roles
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">Configure permissions and organizational hierarchies</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className={cn(
                    "h-9 px-3 rounded-lg transition-all",
                    isSearchOpen ? "bg-white text-cyan-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <Search className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Search</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={cn(
                    "h-9 px-3 rounded-lg transition-all",
                    isFilterOpen || isActiveFilter !== null ? "bg-white text-cyan-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Filter</span>
                  {isActiveFilter !== null && (
                    <span className="ml-1.5 w-2 h-2 rounded-full bg-cyan-500" />
                  )}
                </Button>
              </div>

              <Button
                onClick={handleCreate}
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg shadow-cyan-200 border-0 h-10 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Role
              </Button>
            </div>
          </div>

          {(isSearchOpen || isFilterOpen) && (
            <div className="mt-4 flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-50 animate-in slide-in-from-top-2 duration-200">
              {isSearchOpen && (
                <div className="relative flex-1">
                  <Input
                    placeholder="Search roles by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 bg-gray-50 border-gray-100 rounded-xl focus:bg-white transition-all shadow-inner"
                    autoFocus
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-4.5 w-4.5" />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {isFilterOpen && (
                <div className="flex items-center gap-2">
                  <Select
                    value={isActiveFilter === null ? 'all' : isActiveFilter ? 'active' : 'inactive'}
                    onValueChange={(value) => {
                      if (value === 'all') setIsActiveFilter(null);
                      else setIsActiveFilter(value === 'active');
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="h-11 w-[160px] bg-gray-50 border-gray-100 rounded-xl focus:bg-white shadow-inner">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100 p-1">
                      <SelectItem value="all" className="rounded-lg">All Statuses</SelectItem>
                      <SelectItem value="active" className="rounded-lg">Active Only</SelectItem>
                      <SelectItem value="inactive" className="rounded-lg">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
              <p className="mt-4 text-gray-500 font-medium tracking-tight">Accessing core modules...</p>
            </div>
          ) : roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 border-t border-gray-50">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-600 font-bold tracking-tight">No access roles found</p>
              <p className="text-gray-400 text-sm mt-1">Define permissions to secure your operations</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="border-b-0">
                      <TableHead className="pl-6 font-semibold text-gray-900 text-sm py-4">
                        <button onClick={() => handleSort('name')} className="flex items-center gap-1 group">
                          Role Identity
                          <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </TableHead>

                      <TableHead className="font-semibold text-gray-900 text-sm py-4">Users Linked</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-sm py-4">System Status</TableHead>
                      <TableHead className="text-right pr-6 font-semibold text-gray-900 text-sm py-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id} className="group hover:bg-cyan-50/30 transition-all duration-200 border-b border-gray-50 last:border-0 border-t-0">
                        <TableCell className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-sm border border-white">
                              <Shield className="h-5 w-5 text-gray-600" />
                            </div>
                            <span className="font-semibold text-gray-900 group-hover:text-cyan-700 transition-colors text-sm">
                              {role.name}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-cyan-100/50 flex items-center justify-center">
                              <Users className="h-4 w-4 text-cyan-600" />
                            </div>
                            <span className="text-sm font-bold text-gray-700">{role._count?.employees || 0} Members</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-4">
                          <div
                            onClick={() => handleToggleStatus(role)}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all active:scale-95",
                              role.isActive
                                ? "bg-green-100 text-green-700 border border-green-200/50 shadow-sm shadow-green-100/50"
                                : "bg-gray-100 text-gray-600 border border-gray-200/50"
                            )}
                          >
                            <div className={cn("w-2 h-2 rounded-full", role.isActive ? "bg-green-500 animate-pulse" : "bg-gray-400")} />
                            {role.isActive ? 'AUTHORIZED' : 'DEACTIVATED'}
                          </div>
                        </TableCell>
                        <TableCell className="p-4 pr-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all duration-200">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-2xl border-gray-100">
                              <DropdownMenuItem
                                onClick={() => handleEdit(role)}
                                className="rounded-lg py-2.5 cursor-pointer"
                              >
                                <Edit2 className="mr-2 h-4 w-4 text-cyan-500" />
                                <span>Edit Role</span>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(role.id.toString())}
                                className="rounded-lg py-2.5 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete Role</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                <RowsPerPage value={limit} onChange={setLimit} />
                <div className="text-xs text-gray-500 font-medium">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} roles
                </div>
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent
          className="w-[95vw] sm:max-w-[600px] bg-white border-0 shadow-2xl rounded-2xl p-0 flex flex-col [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-8 pt-8 pb-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  {editingRole ? 'Edit Role' : 'Create New Role'}
                </DialogTitle>
                <p className="text-sm text-gray-600 mt-2">
                  {editingRole ? 'Update role details' : 'Define a new role for your organization'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  disabled={formLoading}
                  className="h-10 px-4 rounded-xl border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-red-600 font-medium transition-all hover:shadow-md"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="role-form"
                  disabled={formLoading}
                  className="h-10 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 active:scale-95"
                >
                  {formLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    editingRole ? 'Update Role' : 'Create Role'
                  )}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8">
            <form id="role-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">Role Name *</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                    <Shield className="h-5 w-5 text-cyan-600" />
                  </div>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={formLoading}
                    placeholder="e.g., Manager, Supervisor"
                    className="pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all"
                  />
                </div>
              </div>



              {editingRole && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Label htmlFor="isActive" className="text-sm font-medium text-gray-900 cursor-pointer">
                        Active Status
                      </Label>
                    </div>
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                      className="data-[state=checked]:bg-cyan-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Inactive roles cannot be assigned to new employees.
                  </p>
                </div>
              )}

              {editingRole && editingRole._count?.employees && editingRole._count.employees > 0 && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p>
                    This role is assigned to <span className="font-semibold">{editingRole._count.employees}</span> employee(s).
                    Deactivating it may affect their access.
                  </p>
                </div>
              )}
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
