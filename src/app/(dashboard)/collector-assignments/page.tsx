'use client';

import { useState, useEffect, useMemo } from 'react';
import { useEmployees, useCreateEmployee, useUpdateEmployee } from '@/hooks/use-employees';
import { useVehicleNames } from '@/hooks/use-vehicle-names';
import { useScrapYards } from '@/hooks/use-scrap-yards';
import { useCollectorAssignments, useCreateCollectorAssignment, useDeleteCollectorAssignment } from '@/hooks/use-collector-assignments';
import { useAuthStore } from '@/lib/store/auth-store';
import { Employee, VehicleName, ScrapYard } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, MoreVertical, UserPlus, Car, MapPin, Truck, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CollectorAssignment {
  id: string;
  collectorId: string;
  collector?: Employee & {
    scrapYard?: {
      id: string;
      yardName: string;
      address: string;
    };
  };
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

export default function CollectorAssignmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'collectors' | 'assignments'>('collectors');
  const [assignmentTab, setAssignmentTab] = useState<'single' | 'crew'>('single');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState<Employee | undefined>();
  const { user } = useAuthStore();

  // Fetch collectors (employees with collector role)
  const { data: employeesData, isLoading: isLoadingCollectors, refetch: refetchEmployees } = useEmployees({
    page: 1,
    limit: 100,
    role: 'COLLECTOR'
  });

  // Fetch collector assignments
  const { data: assignmentsData, isLoading: isLoadingAssignments, refetch: refetchAssignments } = useCollectorAssignments({
    page: 1,
    limit: 100,
  });

  const { data: vehicleNamesData } = useVehicleNames({ page: 1, limit: 100 });
  const { data: scrapYardsData } = useScrapYards({ page: 1, limit: 100, status: 'ACTIVE' });

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

  const scrapYards = useMemo(() => {
    // Match the structure used in Scrap Yards page
    // where `scrapYardsData` looks like: { data: { scrapYards: ScrapYard[]; pagination: {...} } }
    const apiResponse = scrapYardsData as unknown as {
      data?: { scrapYards?: ScrapYard[] };
    } | undefined;
    return apiResponse?.data?.scrapYards || [];
  }, [scrapYardsData]);

  const assignments = useMemo(() => {
    const apiResponse = assignmentsData as unknown as ApiResponse;
    return apiResponse?.data?.assignments || [];
  }, [assignmentsData]) as CollectorAssignment[];

  // Group assignments by collector for crew view
  const assignmentsByCollectorId = useMemo(() => {
    const map = new Map<string, CollectorAssignment[]>();
    for (const assignment of assignments) {
      if (!map.has(assignment.collectorId)) {
        map.set(assignment.collectorId, []);
      }
      map.get(assignment.collectorId)!.push(assignment);
    }
    return map;
  }, [assignments]);

  // Simple crew definition: collectors sharing the same scrap yard form a crew
  const crewCollectors = useMemo(
    () => collectors.filter((c) => (c as any).scrapYardId),
    [collectors]
  );

  const crews = useMemo(() => {
    const groups = new Map<
      string,
      {
        yardId: string;
        yardName: string;
        members: Employee[];
      }
    >();

    for (const collector of crewCollectors) {
      const yardId = (collector as any).scrapYardId as string;
      if (!yardId) continue;

      const existing =
        groups.get(yardId) ??
        {
          yardId,
          yardName: (collector as any).scrapYard?.yardName || 'Unnamed Scrap Yard',
          members: [] as Employee[],
        };

      (existing.members as Employee[]).push(collector);
      groups.set(yardId, existing as {
        yardId: string;
        yardName: string;
        members: Employee[];
      });
    }

    return Array.from(groups.values());
  }, [crewCollectors]);

  // Debounce search term
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

  const handleAssignmentSubmit = async (formData: { vehicleNameId?: string; yardId?: string }) => {
    if (!selectedCollector || !user?.organizationId) return;

    try {
      await createAssignmentMutation.mutateAsync({
        collectorId: selectedCollector.id,
        vehicleNameId: formData.vehicleNameId || undefined,
        scrapYardId: formData.yardId || undefined,
      });
      toast.success('Collector assigned successfully');
      setIsAssignmentFormOpen(false);
      setSelectedCollector(undefined);
      refetchAssignments();
      refetchEmployees();
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
          roleId: 1, // TODO: Get actual collector role ID
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur z-10 py-2">
        <div>
          <h1 className="text-3xl font-bold">Collector Assignments</h1>
          <p className="text-gray-600 mt-1">
            Manage collectors, crews and assign them to vehicles and zones for scrapping
          </p>
        </div>
        <Button onClick={handleCreateCollector} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add Collector
        </Button>
      </div>

      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="border-b">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('collectors')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'collectors'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Collectors
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'assignments'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Assignments
            </button>
          </nav>
        </div>

        {activeTab === 'collectors' && (
          <div className="space-y-4">
            {/* Search */}
            <Card>
              <CardHeader>
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search collectors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Collectors Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Collectors</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingCollectors ? (
                  <div className="text-center py-8">Loading...</div>
                ) : filteredCollectors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No collectors found</div>
                ) : (
                  <Table>
                    <TableHeader>
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
                        <TableRow key={collector.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <Truck className="h-4 w-4 text-blue-500" />
                              <span>{collector.fullName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="text-sm">{collector.email}</div>
                              <div className="text-sm text-gray-500">{collector.phone}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {(collector as any).scrapYard ? (
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="text-sm">{(collector as any).scrapYard.yardName}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={collector.isActive ? 'default' : 'secondary'}>
                              {collector.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAssignCollector(collector)}
                              >
                                Assign
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => {
                                    setSelectedCollector(collector);
                                    setIsFormOpen(true);
                                  }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {/* Assignment type tabs */}
            <div className="flex space-x-4">
              <button
                onClick={() => setAssignmentTab('single')}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors flex items-center gap-2 ${assignmentTab === 'single'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <Truck className="h-4 w-4" />
                Single Collectors
              </button>
              <button
                onClick={() => setAssignmentTab('crew')}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors flex items-center gap-2 ${assignmentTab === 'crew'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <Users className="h-4 w-4" />
                Crews
              </button>
            </div>

            {assignmentTab === 'single' && (
              <Card>
                <CardHeader>
                  <CardTitle>Collector Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingAssignments ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : assignments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No assignments found. Assign collectors to vehicles or zones.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Collector</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Zone</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell className="font-medium">
                              {assignment.collector?.fullName || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {assignment.vehicleName ? (
                                <div className="flex items-center space-x-2">
                                  <Car className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm">{assignment.vehicleName.name}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {assignment.collector?.scrapYard ? (
                                <div className="flex items-center space-x-2">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm">{assignment.collector.scrapYard.yardName}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={assignment.isActive ? 'default' : 'secondary'}>
                                {assignment.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAssignment(assignment.id)}
                                className="text-red-600"
                                disabled={deleteAssignmentMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}

            {assignmentTab === 'crew' && (
              <Card>
                <CardHeader>
                  <CardTitle>Crew Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  {crews.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No crews detected. Assign collectors to a scrap yard to form a crew.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Scrap Yard / Zone</TableHead>
                          <TableHead>Crew Members</TableHead>
                          <TableHead>Vehicles</TableHead>
                          <TableHead>Zones</TableHead>
                          <TableHead>Active Collectors</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {crews.map((crew) => {
                          const crewAssignments = crew.members.flatMap(
                            (member) => assignmentsByCollectorId.get(member.id) ?? []
                          );

                          const uniqueVehicles = Array.from(
                            new Set(
                              crewAssignments
                                .map((a) => a.vehicleName?.name)
                                .filter(Boolean) as string[]
                            )
                          );

                          const uniqueZones = Array.from(
                            new Set(
                              crewAssignments
                                .map((a) => a.city?.name)
                                .filter(Boolean) as string[]
                            )
                          );

                          const activeCount = crew.members.filter((m) => m.isActive).length;

                          return (
                            <TableRow key={crew.yardId}>
                              <TableCell className="font-medium">
                                {crew.yardName}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {crew.members.map((m) => (
                                    <Badge key={m.id} variant="outline">
                                      {m.fullName}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                {uniqueVehicles.length ? (
                                  <div className="flex flex-wrap gap-1">
                                    {uniqueVehicles.map((name) => (
                                      <Badge key={name} variant="secondary">
                                        {name}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {uniqueZones.length ? (
                                  <div className="flex flex-wrap gap-1">
                                    {uniqueZones.map((zone) => (
                                      <Badge key={zone} variant="secondary">
                                        {zone}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {activeCount} / {crew.members.length}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Collector Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCollector ? 'Edit Collector' : 'Add New Collector'}
            </DialogTitle>
          </DialogHeader>
          <CollectorForm
            collector={selectedCollector}
            onSubmit={handleCollectorSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setSelectedCollector(undefined);
            }}
            isLoading={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Assignment Form Dialog */}
      <Dialog open={isAssignmentFormOpen} onOpenChange={setIsAssignmentFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Collector</DialogTitle>
          </DialogHeader>
          <AssignmentForm
            collector={selectedCollector}
            vehicleNames={vehicleNames}
            scrapYards={scrapYards}
            onSubmit={handleAssignmentSubmit}
            onCancel={() => {
              setIsAssignmentFormOpen(false);
              setSelectedCollector(undefined);
            }}
            isLoading={createAssignmentMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Collector Form Component
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
        <Button type="submit" disabled={isLoading}>
          {collector ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Assignment Form Component
function AssignmentForm({
  collector,
  vehicleNames,
  scrapYards,
  onSubmit,
  onCancel,
  isLoading,
}: {
  collector?: Employee;
  vehicleNames: VehicleName[];
  scrapYards: ScrapYard[];
  onSubmit: (data: { vehicleNameId?: string; yardId?: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [vehicleNameId, setVehicleNameId] = useState<string>('none');
  const [yardId, setYardId] = useState<string>('none');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (vehicleNameId === 'none' && yardId === 'none') {
      toast.error('Please select at least one assignment (vehicle or scrap yard)');
      return;
    }
    onSubmit({
      vehicleNameId: vehicleNameId !== 'none' ? vehicleNameId : undefined,
      yardId: yardId !== 'none' ? yardId : undefined,
    });
  };

  const safeScrapYards = Array.isArray(scrapYards) ? scrapYards : [];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {collector && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium">Assigning to: {collector.fullName}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="vehicleName">Vehicle (Optional)</Label>
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
        <Label htmlFor="scrapYard">Zone / Scrap Yard (Optional)</Label>
        <Select value={yardId} onValueChange={setYardId} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Select scrap yard" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {safeScrapYards
              .filter((yard) => yard.isActive !== false)
              .map((yard) => (
                <SelectItem key={yard.id} value={yard.id}>
                  {yard.yardName}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          Assign
        </Button>
      </DialogFooter>
    </form>
  );
}
