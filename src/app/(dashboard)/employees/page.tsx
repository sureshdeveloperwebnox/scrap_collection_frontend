'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmployeeForm } from '@/components/employee-form';
import { Employee } from '@/types';
import { Plus, Search, Edit2, Trash2, UserCheck, UserX, Shield } from 'lucide-react';
import { useEmployees, useDeleteEmployee, useUpdateEmployee } from '@/hooks/use-employees';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Fetch employees from API
  const { data: employeesData, isLoading, error, refetch } = useEmployees({
    page,
    limit,
    search: searchTerm || undefined,
  });

  const deleteEmployeeMutation = useDeleteEmployee();
  const updateEmployeeMutation = useUpdateEmployee();

  // Extract employees and pagination from API response
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

  const toggleEmployeeStatus = async (employee: Employee) => {
    try {
      await updateEmployeeMutation.mutateAsync({
        id: employee.id,
        data: { isActive: !employee.isActive }
      });
      toast.success(`Employee ${employee.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update employee status';
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getRoleIcon = (roleName?: string) => {
    if (!roleName) return UserX;
    const roleLower = roleName.toLowerCase();
    if (roleLower.includes('admin')) return Shield;
    if (roleLower.includes('manager') || roleLower.includes('supervisor')) return UserCheck;
    return UserX;
  };

  // Calculate role stats from actual data
  const roleStats = useMemo(() => {
    const stats: Record<string, number> = {};
    employees.forEach(emp => {
      const roleName = (emp as any).role?.name || emp.role || 'Unknown';
      if (emp.isActive) {
        stats[roleName] = (stats[roleName] || 0) + 1;
      }
    });
    return stats;
  }, [employees]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <p className="text-gray-600 mt-1">Manage your employees and their information</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(roleStats).slice(0, 4).map(([roleName, count], index) => {
          const colors = ['text-purple-600', 'text-blue-600', 'text-green-600', 'text-orange-600'];
          return (
            <Card key={roleName}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium capitalize">{roleName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${colors[index % colors.length]}`}>{count}</div>
              </CardContent>
            </Card>
          );
        })}
        {Object.keys(roleStats).length === 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{employees.filter(e => e.isActive).length}</div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading employees...</div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error loading employees</p>
              <Button onClick={() => refetch()} className="mt-4">Retry</Button>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No employees found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Work Zone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => {
                  const roleName = (employee as any).role?.name || employee.role || 'Unknown';
                  const cityName = (employee as any).city?.name || employee.workZone || 'Not specified';
                  const RoleIcon = getRoleIcon(roleName);
                  return (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <RoleIcon className="h-4 w-4 text-gray-400" />
                          <span>{employee.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{employee.phone}</div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{roleName}</TableCell>
                      <TableCell>{cityName}</TableCell>
                      <TableCell>
                        <Badge variant={employee.isActive ? 'default' : 'secondary'}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(employee.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingEmployee(employee);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleEmployeeStatus(employee)}
                          >
                            {employee.isActive ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteEmployee(employee.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {employees.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <RowsPerPage value={limit} onChange={setLimit} />
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            </div>
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
    </div>
  );
}