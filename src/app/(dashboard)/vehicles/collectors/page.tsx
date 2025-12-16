'use client';

import { useState, useEffect, useMemo } from 'react';
import { useEmployees, useCreateEmployee, useUpdateEmployee } from '@/hooks/use-employees';
import { useVehicleNames } from '@/hooks/use-vehicle-names';
import { useCities } from '@/hooks/use-cities';
import { useCollectorAssignments, useCreateCollectorAssignment, useDeleteCollectorAssignment } from '@/hooks/use-collector-assignments';
import { useAuthStore } from '@/lib/store/auth-store';
import { Employee, VehicleName } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, MoreVertical, UserPlus, Car, MapPin, Truck, CheckCircle2, Shield, Edit2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

function NoDataAnimation({ text = "No data found" }) {
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
        <div className="text-gray-400 text-sm">{text}</div>
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
      <p className="mt-4 text-gray-600 text-sm font-medium">{text}</p>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
      <Shield className="h-3 w-3 flex-shrink-0" />
      Inactive
    </span>
  );
}

interface CollectorAssignment {
  id: string;
  collectorId: string;
  collector?: Employee;
  vehicleNameId?: string;
  vehicleName?: VehicleName;
  cityId?: number;
  city?: { id: number; name: string };
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface ApiResponse {
  data: {
    assignments: CollectorAssignment[];
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

export default function CollectorAssignmentPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'collectors' | 'assignments'>('collectors');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState<Employee | undefined>();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user } = useAuthStore();

  const { data: employeesData, isLoading: isLoadingCollectors } = useEmployees({
    page: 1,
    limit: 100,
    role: 'COLLECTOR'
  });

  const { data: assignmentsData, isLoading: isLoadingAssignments, refetch: refetchAssignments } = useCollectorAssignments({
    page: 1,
    limit: 100,
  });

  const { data: vehicleNamesData } = useVehicleNames({ page: 1, limit: 100 });
  const { data: citiesData } = useCities({ page: 1, limit: 100, status: true });

  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const createAssignmentMutation = useCreateCollectorAssignment();
  const deleteAssignmentMutation = useDeleteCollectorAssignment();

  const collectors = useMemo(() => {
    return employeesData?.data?.employees || [];
  }, [employeesData]) as Employee[];

  const vehicleNames = useMemo(() => {
    const apiResponse = vehicleNamesData as any;
    return apiResponse?.data?.vehicleNames || [];
  }, [vehicleNamesData]) as VehicleName[];

  const cities = useMemo(() => {
    const apiResponse = citiesData as any;
    return apiResponse?.data?.cities || apiResponse?.data || [];
  }, [citiesData]);

  const assignments = useMemo(() => {
    const apiResponse = assignmentsData as unknown as ApiResponse;
    return apiResponse?.data?.assignments || [];
  }, [assignmentsData]) as CollectorAssignment[];

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const filteredCollectors = collectors.filter(collector =>
    collector.fullName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    collector.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    collector.phone.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const handleCreateCollector = () => {
    setSelectedCollector(undefined);
    setIsFormOpen(true);
  };

  const handleAssignCollector = (collector: Employee) => {
    setSelectedCollector(collector);
    setIsAssignmentFormOpen(true);
  };

  const handleAssignmentSubmit = async (formData: { vehicleNameId?: string; cityId?: number }) => {
    if (!selectedCollector || !user?.organizationId) return;

    try {
      await createAssignmentMutation.mutateAsync({
        collectorId: selectedCollector.id,
        vehicleNameId: formData.vehicleNameId || undefined,
        cityId: formData.cityId || undefined,
      });
      toast.success('Collector assigned successfully');
      setIsAssignmentFormOpen(false);
      setSelectedCollector(undefined);
      refetchAssignments();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to assign collector');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (confirm('Are you sure you want to remove this assignment?')) {
      try {
        await deleteAssignmentMutation.mutateAsync(assignmentId);
        toast.success('Assignment removed successfully');
        refetchAssignments();
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to remove assignment');
      }
    }
  };

  const handleCollectorSubmit = async (formData: any) => {
    try {
      if (selectedCollector) {
        await updateEmployeeMutation.mutateAsync({
          id: selectedCollector.id,
          data: formData
        });
        toast.success('Collector updated successfully');
      } else {
        await createEmployeeMutation.mutateAsync({
          ...formData,
          roleId: 1,
          organizationId: user?.organizationId!,
        });
        toast.success('Collector created successfully');
      }
      setIsFormOpen(false);
      setSelectedCollector(undefined);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save collector');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="text-xl font-bold text-gray-900">Collector Assignment</CardTitle>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 h-9 w-9 p-0"
              >
                <Search className="h-4 w-4" />
              </Button>

              {isSearchOpen && (
                <div className="relative animate-in slide-in-from-right-10 duration-200">
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 pl-10 h-9"
                    autoFocus
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                </div>
              )}

              <Button
                onClick={handleCreateCollector}
                className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 w-9 p-0"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="mb-6 border-b border-gray-100">
            <nav className="flex space-x-6">
              <button
                onClick={() => setActiveTab('collectors')}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-all ${activeTab === 'collectors'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Collectors
                </span>
              </button>
              <button
                onClick={() => setActiveTab('assignments')}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-all ${activeTab === 'assignments'
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Assignments
                </span>
              </button>
            </nav>
          </div>

          {activeTab === 'collectors' && (
            <>
              {isLoadingCollectors ? (
                <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin inline text-gray-300" /></div>
              ) : filteredCollectors.length === 0 ? (
                <NoDataAnimation text="No collectors found" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Collector</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Work Zone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCollectors.map((collector) => (
                        <TableRow key={collector.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 text-sm font-bold">
                                {collector.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div>{collector.fullName}</div>
                                <div className="text-xs text-gray-500">{collector.email}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">{collector.phone}</div>
                          </TableCell>
                          <TableCell>
                            {(collector as any).city ? (
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <MapPin className="h-3.5 w-3.5 text-cyan-500" />
                                {(collector as any).city.name}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm italic">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge isActive={collector.isActive} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAssignCollector(collector)}
                                className="text-xs h-7 border-cyan-200 text-cyan-700 hover:bg-cyan-50"
                              >
                                Assign
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4 text-gray-400" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedCollector(collector);
                                    setIsFormOpen(true);
                                  }}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit Details
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}

          {activeTab === 'assignments' && (
            <>
              {isLoadingAssignments ? (
                <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin inline text-gray-300" /></div>
              ) : assignments.length === 0 ? (
                <NoDataAnimation text="No assignments found" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Collector</TableHead>
                        <TableHead>Assigned Vehicle</TableHead>
                        <TableHead>Assigned Zone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {assignment.collector?.fullName || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {assignment.vehicleName ? (
                              <div className="flex items-center gap-2">
                                <div className="p-1 bg-blue-50 rounded text-blue-600"><Car className="h-3 w-3" /></div>
                                <span className="text-sm">{assignment.vehicleName.name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {assignment.city ? (
                              <div className="flex items-center gap-2">
                                <div className="p-1 bg-green-50 rounded text-green-600"><MapPin className="h-3 w-3" /></div>
                                <span className="text-sm">{assignment.city.name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge isActive={assignment.isActive} />
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAssignment(assignment.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={deleteAssignmentMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedCollector ? 'Edit Collector' : 'Add New Collector'}</DialogTitle>
          </DialogHeader>
          <CollectorForm
            collector={selectedCollector}
            onSubmit={handleCollectorSubmit}
            onCancel={() => { setIsFormOpen(false); setSelectedCollector(undefined); }}
            isLoading={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignmentFormOpen} onOpenChange={setIsAssignmentFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Collector</DialogTitle>
          </DialogHeader>
          <AssignmentForm
            collector={selectedCollector}
            vehicleNames={vehicleNames}
            cities={cities}
            onSubmit={handleAssignmentSubmit}
            onCancel={() => { setIsAssignmentFormOpen(false); setSelectedCollector(undefined); }}
            isLoading={createAssignmentMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CollectorForm({
  collector,
  onSubmit,
  onCancel,
  isLoading,
}: {
  collector?: Employee;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [formData, setFormData] = useState({
    fullName: collector?.fullName || '',
    email: collector?.email || '',
    phone: collector?.phone || '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!collector && !formData.password) {
      toast.error('Password is required for new collectors');
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name *</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone *</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
          disabled={isLoading}
        />
      </div>

      {!collector && (
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            disabled={isLoading}
          />
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-cyan-600 hover:bg-cyan-700">
          {collector ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  );
}

function AssignmentForm({
  collector,
  vehicleNames,
  cities,
  onSubmit,
  onCancel,
  isLoading,
}: {
  collector?: Employee;
  vehicleNames: VehicleName[];
  cities: any[];
  onSubmit: (data: { vehicleNameId?: string; cityId?: number }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [vehicleNameId, setVehicleNameId] = useState<string>('none');
  const [cityId, setCityId] = useState<string>('none');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vehicleNameId === 'none' && cityId === 'none') {
      toast.error('Please select at least one assignment (vehicle or zone)');
      return;
    }
    onSubmit({
      vehicleNameId: vehicleNameId !== 'none' ? vehicleNameId : undefined,
      cityId: cityId !== 'none' ? parseInt(cityId) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {collector && (
        <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-lg text-cyan-800">
          <p className="text-sm font-medium flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Assigning to: {collector.fullName}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="vehicleName">Vehicle</Label>
        <Select value={vehicleNameId} onValueChange={setVehicleNameId} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Select vehicle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {vehicleNames.filter(vn => vn.isActive).map((vn) => (
              <SelectItem key={vn.id} value={vn.id}>
                {vn.name} ({vn.vehicleType?.name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="city">Zone</Label>
        <Select value={cityId} onValueChange={setCityId} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Select zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {cities.filter((c: any) => c.isActive).map((city: any) => (
              <SelectItem key={city.id} value={city.id.toString()}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-cyan-600 hover:bg-cyan-700">
          Assign
        </Button>
      </DialogFooter>
    </form>
  );
}
