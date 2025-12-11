'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmployeeForm } from '@/components/employee-form';
import { Employee } from '@/types';
import { Plus, Search, Edit2, Trash2, UserCheck, UserX, Shield } from 'lucide-react';

const mockEmployees: Employee[] = [
  {
    id: '1',
    name: 'John Manager',
    email: 'john.manager@scrap.com',
    phone: '+61 400 111 222',
    role: 'manager',
    status: 'active',
    workZone: 'Sydney Metro',
    createdAt: new Date('2023-12-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Sarah Admin',
    email: 'sarah.admin@scrap.com',
    phone: '+61 400 333 444',
    role: 'admin',
    status: 'active',
    workZone: 'Melbourne',
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '3',
    name: 'Mike Staff',
    email: 'mike.staff@scrap.com',
    phone: '+61 400 555 666',
    role: 'staff',
    status: 'active',
    workZone: 'Brisbane',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '4',
    name: 'Lisa Collector',
    email: 'lisa.collector@scrap.com',
    phone: '+61 400 777 888',
    role: 'collector',
    status: 'inactive',
    workZone: 'Perth',
    vehicleDetails: 'Toyota Hiace - ABC123',
    createdAt: new Date('2023-10-01'),
    updatedAt: new Date('2024-01-05'),
  },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateEmployee = (employeeData: Partial<Employee>) => {
    const newEmployee: Employee = {
      ...employeeData as Employee,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setEmployees([...employees, newEmployee]);
  };

  const handleUpdateEmployee = (employeeData: Partial<Employee>) => {
    setEmployees(employees.map(employee => 
      employee.id === editingEmployee?.id 
        ? { ...employee, ...employeeData, updatedAt: new Date() }
        : employee
    ));
    setEditingEmployee(undefined);
  };

  const handleDeleteEmployee = (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      setEmployees(employees.filter(employee => employee.id !== id));
    }
  };

  const toggleEmployeeStatus = (id: string) => {
    setEmployees(employees.map(employee => 
      employee.id === id 
        ? { 
            ...employee, 
            status: employee.status === 'active' ? 'inactive' : 'active',
            updatedAt: new Date() 
          }
        : employee
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'manager': return UserCheck;
      default: return UserX;
    }
  };

  const roleStats = {
    admin: employees.filter(e => e.role === 'admin' && e.status === 'active').length,
    manager: employees.filter(e => e.role === 'manager' && e.status === 'active').length,
    staff: employees.filter(e => e.role === 'staff' && e.status === 'active').length,
    collector: employees.filter(e => e.role === 'collector' && e.status === 'active').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Employee Management</h1>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">{roleStats.admin}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">{roleStats.manager}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{roleStats.staff}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collectors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{roleStats.collector}</div>
          </CardContent>
        </Card>
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
              {filteredEmployees.map((employee) => {
                const RoleIcon = getRoleIcon(employee.role);
                return (
                  <TableRow key={employee.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <RoleIcon className="h-4 w-4 text-gray-400" />
                        <span>{employee.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{employee.phone}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{employee.role}</TableCell>
                    <TableCell>{employee.workZone || 'Not specified'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(employee.status)}`}>
                        {employee.status}
                      </span>
                    </TableCell>
                    <TableCell>{employee.createdAt.toLocaleDateString()}</TableCell>
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
                          onClick={() => toggleEmployeeStatus(employee.id)}
                        >
                          {employee.status === 'active' ? (
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
        </CardContent>
      </Card>

      <EmployeeForm
        employee={editingEmployee}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEmployee(undefined);
        }}
        onSubmit={editingEmployee ? handleUpdateEmployee : handleCreateEmployee}
      />
    </div>
  );
}