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
import { Plus, Search, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, MoreVertical, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

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
          <h2 className="text-xl font-semibold text-red-600">Error loading roles</h2>
          <p className="text-gray-600 mt-2">Please try again later.</p>
          <Button onClick={() => refetch()} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles Management</h1>
          <p className="text-gray-600 mt-1">Manage employee roles and permissions</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Roles</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={isActiveFilter === null ? 'all' : isActiveFilter ? 'active' : 'inactive'}
                onValueChange={(value) => {
                  if (value === 'all') setIsActiveFilter(null);
                  else setIsActiveFilter(value === 'active');
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading roles...</div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No roles found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center hover:text-gray-900"
                        >
                          Name
                          {getSortIcon('name')}
                        </button>
                      </th>
                      <th className="text-left p-4">Description</th>
                      <th className="text-left p-4">
                        <button
                          onClick={() => handleSort('isActive')}
                          className="flex items-center hover:text-gray-900"
                        >
                          Status
                          {getSortIcon('isActive')}
                        </button>
                      </th>
                      <th className="text-left p-4">Employees</th>
                      <th className="text-right p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.id} className="border-b hover:bg-gray-50">
                        <td className="p-4 font-medium">{role.name}</td>
                        <td className="p-4 text-gray-600">
                          {role.description || <span className="text-gray-400">No description</span>}
                        </td>
                        <td className="p-4">
                          <Badge variant={role.isActive ? 'default' : 'secondary'}>
                            {role.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {role._count?.employees || 0} employee(s)
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(role)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleToggleStatus(role)}>
                                  <Switch className="mr-2 h-4 w-4" />
                                  {role.isActive ? 'Deactivate' : 'Activate'}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(role.id.toString())}
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
              <div className="flex items-center justify-between mt-4">
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Manager, Supervisor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Role description..."
                rows={3}
              />
            </div>
            {editingRole && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            )}
            {editingRole && editingRole._count?.employees && editingRole._count.employees > 0 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  This role is assigned to {editingRole._count.employees} employee(s). 
                  Deactivating it may affect their access.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingRole ? 'Update Role' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

