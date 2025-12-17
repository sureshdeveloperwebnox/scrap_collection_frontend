'use client';

import { useState, useEffect, useMemo } from 'react';
import { useEmployees, useCreateEmployee, useUpdateEmployee } from '@/hooks/use-employees';
import { useVehicleNames } from '@/hooks/use-vehicle-names';
import { useScrapYards } from '@/hooks/use-scrap-yards';
import { useCollectorAssignments, useCreateCollectorAssignment, useUpdateCollectorAssignment, useDeleteCollectorAssignment } from '@/hooks/use-collector-assignments';
import { useCrews, useCreateCrew, useUpdateCrew, useDeleteCrew } from '@/hooks/use-crews';
import { useAuthStore } from '@/lib/store/auth-store';
import { Employee, VehicleName, ScrapYard, Crew } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Search, Edit, Trash2, MoreVertical, UserPlus, Car, MapPin, Truck, CheckCircle2, Shield, Edit2, User, Mail, Phone, Lock, X, Eye, EyeOff, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { isValidPhoneNumber, parsePhoneNumber, CountryCode } from 'libphonenumber-js';

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
  collectorId?: string;
  collector?: Employee;
  crewId?: string;
  crew?: Crew;
  vehicleNameId?: string;
  vehicleName?: VehicleName;
  scrapYardId?: string;
  scrapYard?: ScrapYard;
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
  const [activeTab, setActiveTab] = useState<'collectors' | 'assignments' | 'crews'>('collectors');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCrewFormOpen, setIsCrewFormOpen] = useState(false);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState<Employee | undefined>();
  const [selectedCrew, setSelectedCrew] = useState<Crew | undefined>();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user } = useAuthStore();

  const { data: employeesData, isLoading: isLoadingCollectors } = useEmployees({
    page: 1,
    limit: 100,
    role: 'COLLECTOR'
  });

  const { data: crewsData, isLoading: isLoadingCrews, refetch: refetchCrews } = useCrews();

  const { data: assignmentsData, isLoading: isLoadingAssignments, refetch: refetchAssignments } = useCollectorAssignments({
    page: 1,
    limit: 100,
  });

  const { data: vehicleNamesData } = useVehicleNames({ page: 1, limit: 100 });
  const { data: scrapYardsData } = useScrapYards({ page: 1, limit: 100, status: 'active' });

  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const createAssignmentMutation = useCreateCollectorAssignment();
  const updateAssignmentMutation = useUpdateCollectorAssignment();
  const deleteAssignmentMutation = useDeleteCollectorAssignment();
  const createCrewMutation = useCreateCrew();
  const updateCrewMutation = useUpdateCrew();
  const deleteCrewMutation = useDeleteCrew();
  const [selectedAssignment, setSelectedAssignment] = useState<CollectorAssignment | undefined>();

  const collectors = useMemo(() => {
    return employeesData?.data?.employees || [];
  }, [employeesData]) as Employee[];

  const vehicleNames = useMemo(() => {
    const apiResponse = vehicleNamesData as any;
    return apiResponse?.data?.vehicleNames || [];
  }, [vehicleNamesData]) as VehicleName[];

  const scrapYards = useMemo(() => {
    const apiResponse = scrapYardsData as any;
    // The API returns { data: { scrapYards: [...] } }
    // So we need to access apiResponse.data.scrapYards
    return apiResponse?.data?.scrapYards || [];
  }, [scrapYardsData]) as ScrapYard[];

  const crews = useMemo(() => {
    const apiResponse = crewsData as any;
    return apiResponse?.data?.crews || [];
  }, [crewsData]) as Crew[];

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

  const filteredCrews = crews.filter(crew =>
    crew.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const handleCreateCollector = () => {
    setSelectedCollector(undefined);
    setIsFormOpen(true);
  };

  const handleCreateCrew = () => {
    setSelectedCrew(undefined);
    setIsCrewFormOpen(true);
  };

  const handleAssignCollector = (collector: Employee) => {
    setSelectedCollector(collector);
    setIsAssignmentFormOpen(true);
  };

  const handleEditAssignment = (assignment: CollectorAssignment) => {
    setSelectedAssignment(assignment);
    setSelectedCollector(assignment.collector);
    setIsAssignmentFormOpen(true);
  };



  const handleAssignmentSubmit = async (formData: { collectorId?: string; crewId?: string; vehicleNameId?: string; scrapYardId?: string }) => {
    // If editing, use existing collector/crew ID or form data
    const collectorId = formData.collectorId || selectedCollector?.id || (selectedAssignment?.collectorId && !formData.crewId ? selectedAssignment.collectorId : undefined);
    const crewId = formData.crewId || selectedCrew?.id || (selectedAssignment?.crewId && !formData.collectorId ? selectedAssignment.crewId : undefined);

    if ((!collectorId && !crewId) || !user?.organizationId) {
      toast.error('Missing collector or crew information');
      return;
    }

    try {
      if (selectedAssignment) {
        await updateAssignmentMutation.mutateAsync({
          id: selectedAssignment.id,
          data: {
            vehicleNameId: (formData.vehicleNameId === 'none' ? null : (formData.vehicleNameId || null)) as any,
            scrapYardId: (formData.scrapYardId === 'none' ? null : (formData.scrapYardId || null)) as any,
          }
        });
        toast.success('Assignment updated successfully');
      } else {
        await createAssignmentMutation.mutateAsync({
          collectorId: collectorId || undefined,
          crewId: crewId || undefined,
          vehicleNameId: formData.vehicleNameId === 'none' ? undefined : formData.vehicleNameId,
          scrapYardId: formData.scrapYardId === 'none' ? undefined : formData.scrapYardId,
        });
        toast.success('Resource assigned successfully');
      }
      setIsAssignmentFormOpen(false);
      setSelectedCollector(undefined);
      setSelectedCrew(undefined);
      setSelectedAssignment(undefined);
      refetchAssignments();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save assignment');
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

  const handleCrewSubmit = async (formData: any) => {
    try {
      if (selectedCrew) {
        await updateCrewMutation.mutateAsync({
          id: selectedCrew.id,
          data: formData
        });
        toast.success('Crew updated successfully');
      } else {
        await createCrewMutation.mutateAsync(formData);
        toast.success('Crew created successfully');
      }
      setIsCrewFormOpen(false);
      setSelectedCrew(undefined);
      refetchCrews();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save crew');
    }
  };

  const handleRemoveCrew = async (crewId: string) => {
    if (confirm('Are you sure you want to delete this crew?')) {
      try {
        await deleteCrewMutation.mutateAsync(crewId);
        toast.success('Crew removed successfully');
        refetchCrews();
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to remove crew');
      }
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

              {activeTab === 'collectors' && (
                <Button
                  onClick={handleCreateCollector}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 w-9 p-0"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              )}

              {activeTab === 'crews' && (
                <Button
                  onClick={handleCreateCrew}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 w-9 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}

              {activeTab === 'assignments' && (
                <Button
                  onClick={() => {
                    setSelectedCollector(undefined);
                    setSelectedCrew(undefined);
                    setIsAssignmentFormOpen(true);
                  }}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 px-3 text-xs font-medium"
                >
                  Assign Resource
                </Button>
              )}
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
                onClick={() => setActiveTab('crews')}
                className={`pb-3 px-1 border-b-2 font-medium text-sm transition-all ${activeTab === 'crews'
                  ? 'border-cyan-500 text-cyan-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Crews
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
                            <StatusBadge isActive={collector.isActive} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
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
                        <TableHead>Scrap Yard</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">
                            {assignment.collector ? (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-cyan-500" />
                                {assignment.collector.fullName}
                              </div>
                            ) : assignment.crew ? (
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-purple-500" />
                                {assignment.crew.name}
                              </div>
                            ) : 'Unknown'}
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
                            {assignment.scrapYard ? (
                              <div className="flex items-center gap-2">
                                <div className="p-1 bg-green-50 rounded text-green-600"><MapPin className="h-3 w-3" /></div>
                                <span className="text-sm">{assignment.scrapYard.yardName}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge isActive={assignment.isActive} />
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAssignment(assignment)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
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

          {activeTab === 'crews' && (
            <>
              {isLoadingCrews ? (
                <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin inline text-gray-300" /></div>
              ) : filteredCrews.length === 0 ? (
                <NoDataAnimation text="No crews found" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Crew Name</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCrews.map((crew) => (
                        <TableRow key={crew.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">
                            {crew.name}
                          </TableCell>
                          <TableCell>
                            <div className="flex -space-x-2">
                              {crew.members?.slice(0, 3).map((member, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold" title={member.fullName}>
                                  {member.fullName.charAt(0)}
                                </div>
                              ))}
                              {crew.members?.length > 3 && (
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                                  +{crew.members.length - 3}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 max-w-xs truncate">
                            {crew.description || '-'}
                          </TableCell>
                          <TableCell>
                            <StatusBadge isActive={crew.isActive} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedCrew(crew);
                                  setIsCrewFormOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveCrew(crew.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
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
        <DialogContent
          className="max-w-md sm:max-w-[600px] max-h-[90vh] bg-white border-0 shadow-2xl rounded-2xl p-0 flex flex-col [&>button]:hidden text-left align-middle"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Collector Form</DialogTitle>
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
        <DialogContent
          className="w-[95vw] sm:max-w-[800px] bg-white border-0 shadow-2xl rounded-2xl p-0 flex flex-col [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Assignment Form</DialogTitle>
          </DialogHeader>
          <AssignmentForm
            collector={selectedCollector}
            crew={selectedCrew}
            collectors={collectors}
            crews={crews}
            vehicleNames={vehicleNames}
            scrapYards={scrapYards}
            onSubmit={handleAssignmentSubmit}
            onCancel={() => { setIsAssignmentFormOpen(false); setSelectedCollector(undefined); setSelectedCrew(undefined); }}
            isLoading={createAssignmentMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCrewFormOpen} onOpenChange={setIsCrewFormOpen}>
        <DialogContent
          className="max-w-md sm:max-w-[600px] bg-white border-0 shadow-2xl rounded-2xl p-0 flex flex-col [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Crew Form</DialogTitle>
          </DialogHeader>
          <CrewForm
            crew={selectedCrew}
            collectors={collectors}
            onSubmit={handleCrewSubmit}
            onCancel={() => { setIsCrewFormOpen(false); setSelectedCrew(undefined); }}
            isLoading={createCrewMutation.isPending || updateCrewMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div >
  );
}



import { z } from 'zod'; // Ensure this is imported at file level

// Zod schemas
const createCollectorSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').trim(),
  phone: z.string().min(8, 'Phone number is required').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const updateCollectorSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email address').trim(),
  phone: z.string().min(8, 'Phone number is required').trim(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

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
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);
    setValidationErrors({});

    // Zod Validation
    const schema = collector ? updateCollectorSchema : createCollectorSchema;
    const result = schema.safeParse(formData);

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message;
        }
      });
      setValidationErrors(errors);

      const firstError = result.error.issues[0];
      toast.error(firstError.message);
      return;
    }

    // Additional Phone Validation (libphonenumber-js)
    if (!formData.phone || formData.phone.trim() === '' || formData.phone === '+') {
      setPhoneError('Phone number is required');
      toast.error('Phone number is required');
      return;
    }

    try {
      const phoneToCheck = formData.phone.startsWith('+') ? formData.phone : `+${formData.phone}`;
      let isValid = isValidPhoneNumber(phoneToCheck);

      // Fallback: check national number length if strict validation fails
      if (!isValid) {
        try {
          const parsed = parsePhoneNumber(phoneToCheck);
          if (parsed && parsed.nationalNumber) {
            const len = parsed.nationalNumber.length;
            if (len >= 7 && len <= 15) {
              isValid = true;
            }
          }
        } catch (e) {
          // Ignore parse error, check digits below
        }
      }

      // Final fallback: check total digits
      if (!isValid) {
        const digits = phoneToCheck.replace(/\D/g, '');
        if (digits.length >= 8 && digits.length <= 15) {
          isValid = true;
        }
      }

      if (!isValid) {
        setPhoneError('Please enter a valid phone number');
        toast.error('Please enter a valid phone number');
        return;
      }
    } catch (error) {
      // In case of any unexpected error, rely on basic digit length
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length < 8 || digits.length > 15) {
        setPhoneError('Please enter a valid phone number');
        toast.error('Please enter a valid phone number');
        return;
      }
    }

    // Submit valid data
    const submitData = { ...formData };
    if (!collector && !submitData.password) {
      toast.error('Password is required for new collectors');
      return;
    }
    if (collector && (!submitData.password || submitData.password.trim() === '')) {
      delete (submitData as any).password;
    }

    onSubmit(submitData);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-8 pb-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {collector ? 'Edit Collector' : 'New Collector'}
            </h2>
            <p className="text-sm text-gray-600 mt-2">
              {collector ? 'Update collector information' : 'Add a new collector to your team'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="h-12 px-6 rounded-xl border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-red-600 font-medium transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 disabled:hover:text-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="collector-form"
              disabled={isLoading}
              variant="outline"
              className="relative overflow-hidden group h-12 px-8 rounded-xl border-2 border-cyan-500 text-cyan-600 hover:bg-white hover:text-cyan-700 hover:border-cyan-400 font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all transform hover:scale-105 active:scale-95 bg-white backdrop-blur-sm"
            >
              <span className="absolute inset-0 w-full h-full -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent z-0 skew-x-12" />
              <span className="relative z-10 flex items-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {collector ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  collector ? 'Update Collector' : 'Create Collector'
                )}
              </span>
            </Button>
          </div>
        </div>
      </div>

      <form id="collector-form" onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">Full Name *</Label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-cyan-600" />
                </div>
              </div>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => {
                  setFormData({ ...formData, fullName: e.target.value });
                  if (validationErrors.fullName) setValidationErrors({ ...validationErrors, fullName: '' });
                }}
                disabled={isLoading}
                className={`pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                placeholder="Enter full name"
              />
            </div>
            {validationErrors.fullName && <p className="text-sm text-red-500 mt-1">{validationErrors.fullName}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address *</Label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-cyan-600" />
                </div>
              </div>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (validationErrors.email) setValidationErrors({ ...validationErrors, email: '' });
                }}
                disabled={isLoading}
                className={`pl-14 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                placeholder="Enter email address"
              />
            </div>
            {validationErrors.email && <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number *</Label>
            <div className="flex flex-col gap-2 relative z-20">
              <PhoneInput
                country={'au'}
                value={formData.phone}
                preferredCountries={['au', 'us', 'gb', 'in', 'nz', 'ca']}
                disableCountryGuess={false}
                disableDropdown={false}
                onChange={(value, country, e, formattedValue) => {
                  const phoneWithPlus = value ? `+${value}` : '';
                  setFormData(prev => ({ ...prev, phone: phoneWithPlus }));
                  if (phoneError) setPhoneError(undefined);
                  if (validationErrors.phone) setValidationErrors({ ...validationErrors, phone: '' });
                }}
                onBlur={() => {
                  setPhoneTouched(true);
                  if (formData.phone && formData.phone.trim() !== '' && formData.phone !== '+') {
                    const phoneToCheck = formData.phone.startsWith('+') ? formData.phone : `+${formData.phone}`;
                    try {
                      let isValid = isValidPhoneNumber(phoneToCheck);

                      // Fallback: check national number length
                      if (!isValid) {
                        try {
                          const parsed = parsePhoneNumber(phoneToCheck);
                          if (parsed && parsed.nationalNumber) {
                            const len = parsed.nationalNumber.length;
                            if (len >= 7 && len <= 15) {
                              isValid = true;
                            }
                          }
                        } catch (e) {
                          // ignore
                        }
                      }

                      // Final fallback: total digits
                      if (!isValid) {
                        const digits = phoneToCheck.replace(/\D/g, '');
                        if (digits.length >= 8 && digits.length <= 15) {
                          isValid = true;
                        }
                      }

                      setPhoneError(isValid ? undefined : 'Please enter a valid phone number');
                    } catch (error) {
                      const digits = phoneToCheck.replace(/\D/g, '');
                      // Basic length check as ultimate fallback
                      if (digits.length >= 8 && digits.length <= 15) {
                        setPhoneError(undefined);
                      } else {
                        setPhoneError('Please enter a valid phone number');
                      }
                    }
                  } else {
                    setPhoneError('Phone number is required');
                  }
                }}
                inputProps={{
                  required: true,
                  autoComplete: 'tel'
                }}
                inputClass={`!w-full !h-12 !rounded-xl !border-gray-200 !bg-white !shadow-sm focus:!border-cyan-400 focus:!ring-cyan-200 focus:!ring-2 transition-all ${phoneError && phoneTouched ? '!border-red-500 focus:!border-red-500 focus:!ring-red-200' : ''
                  }`}
                buttonClass={`!border-gray-200 !rounded-l-xl ${phoneError && phoneTouched ? '!border-red-500' : ''}`}
                containerClass={`!w-full ${phoneError && phoneTouched ? 'error' : ''}`}
                dropdownClass="!z-50"
                disabled={isLoading}
                placeholder="Enter phone number"
                specialLabel=""
              />
              {(phoneError && phoneTouched) && (
                <p className="text-sm text-red-600 mt-1">{phoneError}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              {collector ? 'Change Password' : 'Password *'}
            </Label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-cyan-600" />
                </div>
              </div>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  if (validationErrors.password) setValidationErrors({ ...validationErrors, password: '' });
                }}
                disabled={isLoading}
                className={`pl-14 pr-12 h-12 rounded-xl border-gray-200 bg-white shadow-sm focus:border-cyan-400 focus:ring-cyan-200 focus:ring-2 transition-all ${validationErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}`}
                placeholder={collector ? "Leave blank to keep current password" : "Create password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {validationErrors.password && <p className="text-sm text-red-500 mt-1">{validationErrors.password}</p>}
          </div>
        </div>
      </form>
    </div>
  );
}


function CrewForm({
  crew,
  collectors,
  onSubmit,
  onCancel,
  isLoading
}: {
  crew?: Crew;
  collectors: Employee[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [name, setName] = useState(crew?.name || '');
  const [description, setDescription] = useState(crew?.description || '');
  const [memberIds, setMemberIds] = useState<string[]>(crew?.members?.map((m: any) => m.id) || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Crew name is required');
      return;
    }
    if (memberIds.length === 0) {
      toast.error('Select at least one member');
      return;
    }
    onSubmit({ name, description, memberIds });
  };

  const toggleMember = (id: string) => {
    setMemberIds(prev =>
      prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 pt-8 pb-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">{crew ? 'Edit Crew' : 'Create Crew'}</h2>
      </div>
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-2">
          <Label>Crew Name</Label>
          <Input
            value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Alpha Team"
            className="h-12 rounded-xl"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Brief description"
            className="h-12 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label>Members</Label>
          <div className="max-h-48 overflow-y-auto border rounded-xl p-2 space-y-2">
            {collectors.map(c => (
              <div key={c.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer" onClick={(e) => {
                if (e.target !== e.currentTarget && (e.target as HTMLElement).getAttribute('role') === 'checkbox') return;
                toggleMember(c.id);
              }}>
                <Checkbox
                  checked={memberIds.includes(c.id)}
                  onCheckedChange={() => toggleMember(c.id)}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm">{c.fullName}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit" className="bg-cyan-500 hover:bg-cyan-600 text-white" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {crew ? 'Update Crew' : 'Create Crew'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function AssignmentForm({
  collector,
  crew,
  collectors,
  crews = [],
  vehicleNames,
  scrapYards,
  onSubmit,
  onCancel,
  isLoading,
}: {
  collector?: Employee;
  crew?: Crew;
  collectors: Employee[];
  crews?: Crew[];
  vehicleNames: VehicleName[];
  scrapYards: ScrapYard[];
  onSubmit: (data: { collectorId?: string; crewId?: string; vehicleNameId?: string; scrapYardId?: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [type, setType] = useState<'individual' | 'crew'>(crew ? 'crew' : 'individual');
  const [collectorId, setCollectorId] = useState<string>(collector?.id || 'none');
  const [crewId, setCrewId] = useState<string>(crew?.id || 'none');
  const [vehicleNameId, setVehicleNameId] = useState<string>('none');
  const [scrapYardId, setScrapYardId] = useState<string>('none');
  const availableScrapYards = Array.isArray(scrapYards) ? scrapYards : [];

  // Auto-select scrap yard logic... (omitted for brevity, can reuse existing logic if needed)
  // Re-implementing simplified auto-select:
  useEffect(() => {
    if (type === 'individual' && collectorId !== 'none') {
      const c = collectors.find(x => x.id === collectorId);
      if (c?.scrapYardId) setScrapYardId(c.scrapYardId);
    }
  }, [collectorId, type, collectors]);

  // Sync props
  useEffect(() => {
    if (collector) {
      setType('individual');
      setCollectorId(collector.id);
      if (collector.scrapYardId) setScrapYardId(collector.scrapYardId);
    } else if (crew) {
      setType('crew');
      setCrewId(crew.id);
    }
  }, [collector, crew]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'individual' && (collectorId === 'none' || !collectorId)) {
      toast.error('Please select a collector');
      return;
    }
    if (type === 'crew' && (crewId === 'none' || !crewId)) {
      toast.error('Please select a crew');
      return;
    }

    if (vehicleNameId === 'none' && scrapYardId === 'none') {
      toast.error('Please select at least one assignment (vehicle or yard)');
      return;
    }
    onSubmit({
      collectorId: type === 'individual' && collectorId !== 'none' ? collectorId : undefined,
      crewId: type === 'crew' && crewId !== 'none' ? crewId : undefined,
      vehicleNameId: vehicleNameId !== 'none' ? vehicleNameId : undefined,
      scrapYardId: scrapYardId !== 'none' ? scrapYardId : undefined,
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Assign Resources</h2>
            <p className="text-sm text-gray-600 mt-1">Assign vehicle and work zone to collector or crew</p>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="h-12 px-6 rounded-xl border-gray-200">Cancel</Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="h-12 px-8 rounded-xl bg-cyan-600 text-white">
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Confirm Assignment'}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8 overflow-y-auto">
        {/* Type Selection */}
        <div className="flex gap-4 border-b pb-4">
          <Button variant={type === 'individual' ? 'default' : 'outline'} onClick={() => setType('individual')} className={type === 'individual' ? 'bg-cyan-600' : ''}>Individual</Button>
          <Button variant={type === 'crew' ? 'default' : 'outline'} onClick={() => setType('crew')} className={type === 'crew' ? 'bg-cyan-600' : ''}>Crew</Button>
        </div>

        {type === 'individual' ? (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Collector *</Label>
            <Select value={collectorId} onValueChange={setCollectorId} disabled={isLoading || !!collector}>
              <SelectTrigger className="pl-14 h-14 rounded-xl"><SelectValue placeholder="Select collector" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select collector</SelectItem>
                {collectors.map((c) => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Crew *</Label>
            <Select value={crewId} onValueChange={setCrewId} disabled={isLoading || !!crew}>
              <SelectTrigger className="pl-14 h-14 rounded-xl"><SelectValue placeholder="Select crew" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select crew</SelectItem>
                {crews.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Vehicle</Label>
            <Select value={vehicleNameId} onValueChange={setVehicleNameId} disabled={isLoading}>
              <SelectTrigger className="pl-14 h-14 rounded-xl"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
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

          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Work Zone (Scrap Yard)</Label>
            <Select value={scrapYardId} onValueChange={setScrapYardId} disabled={isLoading}>
              <SelectTrigger className="pl-14 h-14 rounded-xl"><SelectValue placeholder="Select work zone" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {availableScrapYards.filter((yard) => yard.isActive !== false).map((yard) => (
                  <SelectItem key={yard.id} value={yard.id}>{yard.yardName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}