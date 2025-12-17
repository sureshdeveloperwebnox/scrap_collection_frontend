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
import { Plus, Search, Edit2, Trash2, ArrowUpDown, ArrowUp, ArrowDown, MoreVertical, AlertCircle, Shield, X, Filter, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

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
      <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-xl font-bold text-gray-900">Roles Management</CardTitle>

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
                className={`border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-gray-900 active:bg-gray-200 transition-all h-9 w-9 p-0 ${isActiveFilter !== null ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : ''
                  } ${isFilterOpen ? 'border-cyan-500 bg-cyan-50' : ''}`}
              >
                <Filter className={`h-4 w-4 ${isActiveFilter !== null ? 'text-cyan-700' : ''}`} />
              </Button>

              <Button
                onClick={handleCreate}
                className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 w-9 p-0"
                title="Add Role"
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
                    value={isActiveFilter === null ? 'all' : isActiveFilter ? 'active' : 'inactive'}
                    onValueChange={(value) => {
                      if (value === 'all') setIsActiveFilter(null);
                      else setIsActiveFilter(value === 'active');
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className={`w-[200px] bg-white border-gray-200 hover:border-gray-300 transition-all ${isActiveFilter !== null ? 'border-cyan-500 ring-2 ring-cyan-200' : ''
                      }`}>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  {isActiveFilter !== null && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsActiveFilter(null)}
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
              <span className="text-gray-600">Loading roles...</span>
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No roles found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center hover:text-cyan-600 transition-colors"
                        >
                          Name
                          {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />)}
                        </button>
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Description</th>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">
                        <button
                          onClick={() => handleSort('isActive')}
                          className="flex items-center hover:text-cyan-600 transition-colors"
                        >
                          Status
                          {sortBy === 'isActive' && (sortOrder === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />)}
                        </button>
                      </th>
                      <th className="text-left p-4 font-semibold text-gray-600 text-sm">Employees</th>
                      <th className="text-right p-4 font-semibold text-gray-600 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {roles.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{role.name}</td>
                        <td className="p-4 text-gray-600 text-sm truncate max-w-xs">
                          {role.description || <span className="text-gray-400 italic">No description</span>}
                        </td>
                        <td className="p-4">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${role.isActive
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                              }`}
                          >
                            {role.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-cyan-500" />
                            {role._count?.employees || 0}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(role)}
                              className="h-8 w-8 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(role.id.toString())}
                              className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <RowsPerPage value={limit} onChange={setLimit} />
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

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Role description..."
                  rows={4}
                  disabled={formLoading}
                  className="rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all resize-none p-4"
                />
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
