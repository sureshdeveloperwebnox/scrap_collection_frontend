'use client';

import { useState, useEffect, useMemo } from 'react';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from '@/hooks/use-employees';
import { useVehicleNames } from '@/hooks/use-vehicle-names';
import { useScrapYards } from '@/hooks/use-scrap-yards';
import { useCollectorAssignments, useCreateCollectorAssignment, useUpdateCollectorAssignment, useDeleteCollectorAssignment } from '@/hooks/use-collector-assignments';
import { useCrews, useCreateCrew, useUpdateCrew, useDeleteCrew } from '@/hooks/use-crews';
import { useAuthStore } from '@/lib/store/auth-store';
import { Employee, VehicleName, ScrapYard, Crew } from '@/types';
import {
  Plus, Search, Edit2, Trash2, MoreHorizontal, UserPlus, Car, MapPin, Truck, CheckCircle2, Shield, Edit, User, Mail, Phone, Lock, X, Eye, EyeOff, Users, ChevronDown, UserCheck, UserX, AlertCircle, Info, Filter
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { isValidPhoneNumber, parsePhoneNumber, CountryCode } from 'libphonenumber-js';

// Dynamically import Lottie for better performance
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Improved No Data Animation Component
function NoDataAnimation({ text = "No data found", subtext = "Try adjusting your filters" }) {
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
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
        <p className="mt-4 text-gray-500 text-sm animate-pulse">Loading amazing content...</p>
      </div>
    );
  }

  if (!animationData) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Info className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium">{text}</p>
        <p className="text-gray-400 text-sm mt-1">{subtext}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="w-56 h-56 md:w-72 md:h-72 flex items-center justify-center">
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
      <p className="mt-2 text-gray-700 text-lg font-bold tracking-tight">{text}</p>
      <p className="text-gray-500 text-sm mt-1 max-w-[250px] text-center">{subtext}</p>
    </div>
  );
}

// Premium Status Badge Component
function StatusBadge({ status, showDropdownIcon = false }: { status: string; showDropdownIcon?: boolean }) {
  const isActive = status.toUpperCase() === 'ACTIVE';
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300",
      isActive
        ? "bg-green-100 text-green-700 border border-green-200/50 shadow-sm shadow-green-100/50"
        : "bg-gray-100 text-gray-600 border border-gray-200/50"
    )}>
      <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-green-500 animate-pulse" : "bg-gray-400")} />
      {status}
      {showDropdownIcon && <ChevronDown className="h-3 w-3 ml-0.5 opacity-50 group-hover:opacity-100 transition-opacity" />}
    </span>
  );
}

// Collector Avatar Component
function CollectorAvatar({ name, className = '' }: { name: string; className?: string }) {
  const firstLetter = (name || 'U').charAt(0).toUpperCase();
  const colors = [
    'from-cyan-400 to-cyan-600',
    'from-blue-400 to-blue-600',
    'from-indigo-400 to-indigo-600',
    'from-purple-400 to-purple-600',
    'from-emerald-400 to-emerald-600'
  ];
  // Simple hash for consistent color
  const colorIndex = name ? name.charCodeAt(0) % colors.length : 0;

  return (
    <div className={cn(
      "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-sm border-2 border-white",
      colors[colorIndex],
      className
    )}>
      <span className="text-white font-bold leading-none text-sm">
        {firstLetter}
      </span>
    </div>
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
  const { user } = useAuthStore();

  // Main states
  const [activeTab, setActiveTab] = useState<'collectors' | 'crews' | 'assignments'>('collectors');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Pagination states
  const [collectorPage, setCollectorPage] = useState(1);
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [crewPage, setCrewPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCrewFormOpen, setIsCrewFormOpen] = useState(false);
  const [isAssignmentFormOpen, setIsAssignmentFormOpen] = useState(false);

  // Selected Resources
  const [selectedCollector, setSelectedCollector] = useState<Employee | undefined>();
  const [selectedCrew, setSelectedCrew] = useState<Crew | undefined>();
  const [selectedCollectors, setSelectedCollectors] = useState<Set<string>>(new Set());

  const { data: employeesData, isLoading: isLoadingCollectors, refetch: refetchCollectors } = useEmployees({
    page: collectorPage,
    limit: activeTab === 'collectors' ? limit : 100,
    search: debouncedSearchTerm || undefined,
    role: 'COLLECTOR',
    isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE'
  });

  const { data: crewsData, isLoading: isLoadingCrews, refetch: refetchCrews } = useCrews();

  const { data: assignmentsData, isLoading: isLoadingAssignments, refetch: refetchAssignments } = useCollectorAssignments({
    page: assignmentPage,
    limit: activeTab === 'assignments' ? limit : 100,
    search: debouncedSearchTerm || undefined,
  });

  const { data: vehicleNamesData } = useVehicleNames({ page: 1, limit: 100 });
  const { data: scrapYardsData } = useScrapYards({ page: 1, limit: 100, status: 'active' });

  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();
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

  const collectorsPagination = useMemo(() => {
    return (employeesData as any)?.data?.pagination || {
      page: collectorPage,
      limit: limit,
      total: 0,
      totalPages: 0
    };
  }, [employeesData, collectorPage, limit]);

  const assignmentsPagination = useMemo(() => {
    return (assignmentsData as any)?.data?.pagination || {
      page: assignmentPage,
      limit: limit,
      total: 0,
      totalPages: 0
    };
  }, [assignmentsData, assignmentPage, limit]);

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
    crew.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    crew.description?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    crew.members?.some(m => m.fullName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
  );

  const paginatedCrews = useMemo(() => {
    const start = (crewPage - 1) * limit;
    return filteredCrews.slice(start, start + limit);
  }, [filteredCrews, crewPage, limit]);

  // Selection handlers
  const handleSelectCollector = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedCollectors);
    if (checked) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedCollectors(newSelected);
  };

  const handleSelectAllCollectors = (checked: boolean) => {
    if (checked) {
      const allIds = filteredCollectors.map(c => c.id);
      setSelectedCollectors(new Set(allIds));
    } else {
      setSelectedCollectors(new Set());
    }
  };

  const isAllSelected = filteredCollectors.length > 0 && selectedCollectors.size === filteredCollectors.length;

  const onInlineStatusChange = async (collector: Employee, value: string) => {
    try {
      const newActiveStatus = value.toUpperCase() === 'ACTIVE';
      if (collector.isActive === newActiveStatus) return;

      await updateEmployeeMutation.mutateAsync({
        id: collector.id,
        data: { isActive: newActiveStatus }
      });
      toast.success(`Collector ${newActiveStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const onInlineCrewStatusChange = async (crew: Crew, value: string) => {
    try {
      const newActiveStatus = value.toUpperCase() === 'ACTIVE';
      if (crew.isActive === newActiveStatus) return;

      await updateCrewMutation.mutateAsync({
        id: crew.id,
        data: { isActive: newActiveStatus }
      });
      toast.success(`Crew ${newActiveStatus ? 'activated' : 'deactivated'} successfully`);
      refetchCrews();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  };

  const onInlineAssignmentStatusChange = async (assignment: any, value: string) => {
    try {
      const newActiveStatus = value.toUpperCase() === 'ACTIVE';
      if (assignment.isActive === newActiveStatus) return;

      await updateAssignmentMutation.mutateAsync({
        id: assignment.id,
        data: { isActive: newActiveStatus }
      });
      toast.success(`Assignment ${newActiveStatus ? 'activated' : 'deactivated'} successfully`);
      refetchAssignments();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update status');
    }
  };

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

  const handleDeleteCollector = async (id: string) => {
    if (confirm('Are you sure you want to delete this collector? This action cannot be undone.')) {
      try {
        await deleteEmployeeMutation.mutateAsync(id);
        toast.success('Collector deleted successfully');
        refetchCollectors();
      } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Failed to delete collector');
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-xl shadow-gray-200/50 border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300">
        <CardHeader className="pb-4 bg-white">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent">
                Resources Management
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">Manage collectors, crews and work assignments</p>
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
                    isFilterOpen || statusFilter !== 'ALL' ? "bg-white text-cyan-600 shadow-sm" : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Filter</span>
                  {statusFilter !== 'ALL' && (
                    <span className="ml-1.5 w-2 h-2 rounded-full bg-cyan-500" />
                  )}
                </Button>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg shadow-cyan-200 border-0 h-10 px-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                    <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-gray-100">
                  <DropdownMenuItem onClick={handleCreateCollector} className="rounded-lg py-2.5 cursor-pointer">
                    <UserPlus className="mr-2 h-4 w-4 text-cyan-500" />
                    <span>Create Collector</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleCreateCrew} className="rounded-lg py-2.5 cursor-pointer">
                    <Users className="mr-2 h-4 w-4 text-purple-500" />
                    <span>Build New Crew</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedCollector(undefined);
                      setSelectedCrew(undefined);
                      setIsAssignmentFormOpen(true);
                    }}
                    className="rounded-lg py-2.5 cursor-pointer"
                  >
                    <MapPin className="mr-2 h-4 w-4 text-emerald-500" />
                    <span>Assign Resources</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {(isSearchOpen || isFilterOpen) && (
            <div className="mt-4 flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-50 animate-in slide-in-from-top-2 duration-200">
              {isSearchOpen && (
                <div className="relative flex-1">
                  <Input
                    placeholder="Search by name, email or phone..."
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

              {isFilterOpen && activeTab === 'collectors' && (
                <div className="flex items-center gap-2">
                  <Select
                    value={statusFilter}
                    onValueChange={(v: any) => {
                      setStatusFilter(v);
                      setCollectorPage(1);
                    }}
                  >
                    <SelectTrigger className="h-11 w-[160px] bg-gray-50 border-gray-100 rounded-xl focus:bg-white shadow-inner">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl border-gray-100 p-1">
                      <SelectItem value="ALL" className="rounded-lg">All Statuses</SelectItem>
                      <SelectItem value="ACTIVE" className="rounded-lg">Active Only</SelectItem>
                      <SelectItem value="INACTIVE" className="rounded-lg">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="px-6 py-1 bg-gray-50/50 border-y border-gray-100">
            <nav className="flex items-center">
              {(['collectors', 'crews', 'assignments'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative py-4 px-4 text-sm font-semibold transition-all duration-300 flex items-center gap-2 group",
                    activeTab === tab
                      ? "text-cyan-600"
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {tab === 'collectors' && <Truck className={cn("h-4 w-4 transition-transform group-hover:scale-110", activeTab === tab ? "text-cyan-500" : "")} />}
                  {tab === 'crews' && <Users className={cn("h-4 w-4 transition-transform group-hover:scale-110", activeTab === tab ? "text-purple-500" : "")} />}
                  {tab === 'assignments' && <MapPin className={cn("h-4 w-4 transition-transform group-hover:scale-110", activeTab === tab ? "text-emerald-500" : "")} />}
                  <span className="capitalize">{tab}</span>
                  {activeTab === tab && (
                    <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-cyan-500 rounded-full animate-in fade-in slide-in-from-bottom-1 duration-300" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {activeTab === 'collectors' && (
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
              {isLoadingCollectors ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
                  <p className="mt-4 text-gray-500 font-medium">Loading collectors...</p>
                </div>
              ) : filteredCollectors.length === 0 ? (
                <NoDataAnimation text="No collectors found" subtext="Start by adding your first field collector" />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow className="border-b-0">
                          <TableHead className="w-12 pl-6">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={handleSelectAllCollectors}
                              className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                            />
                          </TableHead>
                          <TableHead className="font-semibold text-gray-900 text-sm py-4">Collector</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-sm py-4">Contact</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-sm py-4">Status</TableHead>
                          <TableHead className="text-right pr-6 font-semibold text-gray-900 text-sm py-4">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCollectors.map((collector) => (
                          <TableRow key={collector.id} className="group hover:bg-cyan-50/30 transition-colors duration-200">
                            <TableCell className="pl-6">
                              <Checkbox
                                checked={selectedCollectors.has(collector.id)}
                                onCheckedChange={(checked) => handleSelectCollector(collector.id, checked as boolean)}
                                className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500 shadow-sm"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <CollectorAvatar name={collector.fullName} />
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-900 group-hover:text-cyan-700 transition-colors text-sm">
                                    {collector.fullName}
                                  </span>
                                  <span className="text-[11px] text-gray-400 font-medium">COL-ID: {collector.id.slice(0, 8)}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 uppercase tracking-tighter">
                                  <Phone className="w-3 h-3 text-cyan-500" />
                                  {collector.phone}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 lowercase">
                                  <Mail className="w-3 h-3 text-gray-300" />
                                  {collector.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={collector.isActive ? 'Active' : 'Inactive'}
                                  onValueChange={(v) => onInlineStatusChange(collector, v)}
                                >
                                  <SelectTrigger className="h-auto w-auto p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none max-w-none min-w-0 overflow-visible group">
                                    <div className="flex items-center">
                                      <StatusBadge status={collector.isActive ? 'Active' : 'Inactive'} showDropdownIcon={true} />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent className="min-w-[120px] rounded-xl shadow-2xl border-gray-100 bg-white p-1">
                                    {['Active', 'Inactive'].map((s) => (
                                      <SelectItem key={s} value={s} className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-gray-50 focus:bg-cyan-50 focus:text-cyan-700 transition-colors">
                                        {s}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all duration-200">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-2xl border-gray-100">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedCollector(collector);
                                      setIsFormOpen(true);
                                    }}
                                    className="rounded-lg py-2.5 cursor-pointer"
                                  >
                                    <Edit2 className="mr-2 h-4 w-4 text-cyan-500" />
                                    <span>Edit Details</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedCollector(collector);
                                      setIsAssignmentFormOpen(true);
                                    }}
                                    className="rounded-lg py-2.5 cursor-pointer"
                                  >
                                    <Truck className="mr-2 h-4 w-4 text-emerald-500" />
                                    <span>Assign Vehicle</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteCollector(collector.id)}
                                    className="rounded-lg py-2.5 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <RowsPerPage
                      value={limit}
                      onChange={(val) => { setLimit(val); setCollectorPage(1); }}
                      options={[5, 10, 20, 50]}
                    />
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      SHOWING {((collectorsPagination.page - 1) * collectorsPagination.limit) + 1} - {Math.min(collectorsPagination.page * collectorsPagination.limit, collectorsPagination.total)} OF {collectorsPagination.total}
                    </div>
                    <Pagination
                      currentPage={collectorsPagination.page}
                      totalPages={collectorsPagination.totalPages}
                      onPageChange={setCollectorPage}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
              {isLoadingAssignments ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-cyan-500" />
                  <p className="mt-4 text-gray-500 font-medium">Fetching assignments...</p>
                </div>
              ) : assignments.length === 0 ? (
                <NoDataAnimation text="No current assignments" subtext="Assign vehicles and scrap yards to collectors" />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow className="border-b-0">
                          <TableHead className="pl-6 font-semibold text-gray-900 text-sm py-4">Resource</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-sm py-4">Vehicle</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-sm py-4">Scrap Yard</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-sm py-4">Status</TableHead>
                          <TableHead className="text-right pr-6 font-semibold text-gray-900 text-sm py-4">Control</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.map((assignment) => (
                          <TableRow key={assignment.id} className="group hover:bg-cyan-50/30 transition-all duration-200">
                            <TableCell className="pl-6">
                              {assignment.collector ? (
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center text-cyan-600">
                                    <User className="h-4 w-4" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-gray-900 group-hover:text-cyan-700 transition-colors text-sm">
                                      {assignment.collector.fullName}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-semibold bg-gray-50 px-1.5 py-0.5 rounded w-fit mt-0.5">COLLECTOR</span>
                                  </div>
                                </div>
                              ) : assignment.crew ? (
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                                    <Users className="h-4 w-4" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-purple-700 group-hover:text-purple-800 transition-colors text-sm">
                                      {assignment.crew.name}
                                    </span>
                                    <span className="text-[10px] text-purple-400 font-semibold bg-purple-50 px-1.5 py-0.5 rounded w-fit mt-0.5 text-center">CREW</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">Unassigned</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {assignment.vehicleName ? (
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600 border border-blue-100 shadow-sm">
                                    <Truck className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-700">{assignment.vehicleName.name}</span>
                                    {assignment.vehicleName.vehicleType && (
                                      <span className="text-[10px] text-gray-400 font-medium">{assignment.vehicleName.vehicleType.name}</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="inline-flex items-center px-2 py-1 rounded bg-gray-50 text-gray-400 text-[10px] border border-gray-100 font-bold">MISSING VEHICLE</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {assignment.scrapYard ? (
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600 border border-emerald-100 shadow-sm">
                                    <MapPin className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-700">{assignment.scrapYard.yardName}</span>
                                    {assignment.scrapYard.address && (
                                      <span className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">{assignment.scrapYard.address}</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="inline-flex items-center px-2 py-1 rounded bg-gray-50 text-gray-400 text-[10px] border border-gray-100 font-bold uppercase">Yard Not Assigned</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={assignment.isActive ? 'Active' : 'Inactive'}
                                  onValueChange={(v) => onInlineAssignmentStatusChange(assignment, v)}
                                >
                                  <SelectTrigger className="h-auto w-auto p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none max-w-none min-w-0 overflow-visible group">
                                    <div className="flex items-center">
                                      <StatusBadge status={assignment.isActive ? 'Active' : 'Inactive'} showDropdownIcon={true} />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent className="min-w-[120px] rounded-xl shadow-2xl border-gray-100 bg-white p-1">
                                    {['Active', 'Inactive'].map((s) => (
                                      <SelectItem key={s} value={s} className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-gray-50 focus:bg-cyan-50 focus:text-cyan-700 transition-colors">
                                        {s}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all duration-200">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-2xl border-gray-100">
                                  <DropdownMenuItem
                                    onClick={() => handleEditAssignment(assignment)}
                                    className="rounded-lg py-2.5 cursor-pointer"
                                  >
                                    <Edit2 className="mr-2 h-4 w-4 text-cyan-500" />
                                    <span>Update Assignment</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleRemoveAssignment(assignment.id)}
                                    className="rounded-lg py-2.5 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Nullify Assignment</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Assignment Pagination */}
                  <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <RowsPerPage
                      value={limit}
                      onChange={(val) => { setLimit(val); setAssignmentPage(1); }}
                      options={[5, 10, 20, 50]}
                    />
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      INDEX {((assignmentsPagination.page - 1) * assignmentsPagination.limit) + 1} - {Math.min(assignmentsPagination.page * assignmentsPagination.limit, assignmentsPagination.total)} TOTAL {assignmentsPagination.total}
                    </div>
                    <Pagination
                      currentPage={assignmentsPagination.page}
                      totalPages={assignmentsPagination.totalPages}
                      onPageChange={setAssignmentPage}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'crews' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {isLoadingCrews ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                  <p className="mt-4 text-gray-500 font-medium">Assembling crews...</p>
                </div>
              ) : filteredCrews.length === 0 ? (
                <NoDataAnimation text="No crews formed" subtext="Create a crew by combining multiple collectors" />
              ) : (
                <div className="flex flex-col">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50/50">
                        <TableRow className="border-b-0">
                          <TableHead className="pl-6 font-semibold text-gray-900 text-sm py-4">Crew Detail</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-sm py-4">Collective Members</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-sm py-4">Status</TableHead>
                          <TableHead className="text-right pr-6 font-semibold text-gray-900 text-sm py-4">Operations</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedCrews.map((crew) => (
                          <TableRow key={crew.id} className="group hover:bg-purple-50/30 transition-all duration-200">
                            <TableCell className="pl-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm border border-purple-200/50">
                                  <Users className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors text-sm">{crew.name}</span>
                                  <span className="text-[11px] text-gray-400 font-medium line-clamp-1 max-w-[200px]">{crew.description || 'No description set'}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex -space-x-2.5 overflow-hidden p-1">
                                  {crew.members?.slice(0, 4).map((member, i) => (
                                    <CollectorAvatar
                                      key={i}
                                      name={member.fullName}
                                      className="w-8 h-8 border-2 border-white shadow-sm ring-1 ring-gray-100"
                                    />
                                  ))}
                                  {crew.members?.length > 4 && (
                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm ring-1 ring-gray-100">
                                      +{crew.members.length - 4}
                                    </div>
                                  )}
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{crew.members?.length || 0} TOTAL</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={crew.isActive ? 'Active' : 'Inactive'}
                                  onValueChange={(v) => onInlineCrewStatusChange(crew, v)}
                                >
                                  <SelectTrigger className="h-auto w-auto p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 shadow-none max-w-none min-w-0 overflow-visible group">
                                    <div className="flex items-center">
                                      <StatusBadge status={crew.isActive ? 'Active' : 'Inactive'} showDropdownIcon={true} />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent className="min-w-[120px] rounded-xl shadow-2xl border-gray-100 bg-white p-1">
                                    {['Active', 'Inactive'].map((s) => (
                                      <SelectItem key={s} value={s} className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-gray-50 focus:bg-cyan-50 focus:text-cyan-700 transition-colors">
                                        {s}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all duration-200">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 p-2 rounded-xl shadow-2xl border-gray-100">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedCrew(crew);
                                      setIsCrewFormOpen(true);
                                    }}
                                    className="rounded-lg py-2.5 cursor-pointer"
                                  >
                                    <Edit2 className="mr-2 h-4 w-4 text-cyan-500" />
                                    <span>Edit Crew</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleRemoveCrew(crew.id)}
                                    className="rounded-lg py-2.5 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Disband Crew</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Crew Pagination Controls */}
                  <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <RowsPerPage
                      value={limit}
                      onChange={(val) => { setLimit(val); setCrewPage(1); }}
                      options={[5, 10, 20, 50]}
                    />
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      SHOWING {((crewPage - 1) * limit) + 1} - {Math.min(crewPage * limit, filteredCrews.length)} OF {filteredCrews.length}
                    </div>
                    <Pagination
                      currentPage={crewPage}
                      totalPages={Math.ceil(filteredCrews.length / limit)}
                      onPageChange={setCrewPage}
                    />
                  </div>
                </div>
              )}
            </div>
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
              className="h-12 px-6 rounded-xl border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-red-600 font-medium transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="flex flex-col h-full bg-white">
      {/* Premium Header */}
      <div className="px-8 pt-8 pb-6 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              {crew ? 'Edit Crew' : 'Build New Crew'}
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              {crew ? 'Update crew details and membership' : 'Create a collective team for assignments'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="h-12 px-6 rounded-xl border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-red-600 font-medium transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-200 border-0 transition-all transform hover:scale-[1.02] active:scale-95 font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>{crew ? 'Update Crew' : 'Create Crew'}</>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6 overflow-y-auto flex-1">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Crew Name *</Label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Downtown Squad"
                className="pl-14 h-14 rounded-xl border-gray-200 focus:border-purple-400 focus:ring-purple-200 transition-all shadow-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Mission Description</Label>
            <div className="relative">
              <div className="absolute left-4 top-4 z-10 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                <Edit2 className="h-4 w-4 text-gray-400" />
              </div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Briefly describe the crew's purpose..."
                className="w-full pl-14 pt-4 min-h-[100px] rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all shadow-sm resize-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-700">Collective Members *</Label>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {memberIds.length} Selected
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {collectors.map(c => (
                <div
                  key={c.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md",
                    memberIds.includes(c.id)
                      ? "border-purple-200 bg-purple-50/50 ring-1 ring-purple-100"
                      : "border-gray-100 bg-white hover:border-gray-200"
                  )}
                  onClick={() => toggleMember(c.id)}
                >
                  <Checkbox
                    checked={memberIds.includes(c.id)}
                    onCheckedChange={() => toggleMember(c.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                  />
                  <div className="flex items-center gap-2">
                    <CollectorAvatar name={c.fullName} className="w-8 h-8 text-[10px]" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900 line-clamp-1">{c.fullName}</span>
                      <span className="text-[10px] text-gray-500 font-medium">Collector</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
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
      <div className="px-8 pt-8 pb-6 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Assign Resources</h2>
            <p className="text-sm text-gray-500 mt-2">Deploy vehicles and work zones to your team</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="h-12 px-6 rounded-xl border-gray-200 bg-white hover:bg-gray-100 hover:border-gray-300 text-gray-700 hover:text-red-600 font-medium transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-200 border-0 transition-all transform hover:scale-[1.02] active:scale-95 font-bold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Deploying...
                </>
              ) : (
                'Confirm Assignment'
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8 overflow-y-auto flex-1">
        {/* Type Selection */}
        <div className="p-1 bg-gray-100 rounded-2xl w-fit flex gap-1">
          <button
            onClick={() => setType('individual')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              type === 'individual' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Individual
            </div>
          </button>
          <button
            onClick={() => setType('crew')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              type === 'crew' ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Crew
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Target Resource Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
              {type === 'individual' ? <User className="h-3.5 w-3.5 text-emerald-500" /> : <Users className="h-3.5 w-3.5 text-purple-500" />}
              {type === 'individual' ? 'Select Collector' : 'Select Crew'}
            </Label>
            <div className="relative">
              <Select value={collectorId} onValueChange={setCollectorId} disabled={isLoading || !!collector || (type === 'crew')}>
                <SelectTrigger className={cn("h-14 rounded-xl border-gray-200 focus:ring-emerald-200 focus:border-emerald-400 transition-all shadow-sm", type === 'crew' ? 'hidden' : 'flex')}>
                  <SelectValue placeholder="Identify Collector..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-100 shadow-2xl">
                  <SelectItem value="none">Choose a field agent...</SelectItem>
                  {collectors.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="rounded-lg">
                      <div className="flex items-center gap-2">
                        <CollectorAvatar name={c.fullName} className="w-6 h-6 text-[8px]" />
                        {c.fullName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {type === 'crew' && (
                <Select value={crewId} onValueChange={setCrewId} disabled={isLoading || !!crew}>
                  <SelectTrigger className="h-14 rounded-xl border-gray-200 focus:ring-purple-200 focus:border-purple-400 transition-all shadow-sm flex">
                    <SelectValue placeholder="Identify Crew..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 shadow-2xl">
                    <SelectItem value="none">Choose a collective...</SelectItem>
                    {crews.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="rounded-lg">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-purple-600" />
                          {c.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="hidden md:block" />

          {/* Vehicle Assignment */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
              <Truck className="h-3.5 w-3.5 text-blue-500" />
              Vehicle Name
            </Label>
            <Select value={vehicleNameId} onValueChange={setVehicleNameId} disabled={isLoading}>
              <SelectTrigger className="h-14 rounded-xl border-gray-200 focus:ring-blue-200 focus:border-blue-400 transition-all shadow-sm">
                <SelectValue placeholder="Assign Vehicle..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-100 shadow-2xl">
                <SelectItem value="none" className="text-gray-400 italic font-medium">No vehicle assigned</SelectItem>
                {vehicleNames.filter(vn => vn.isActive).map((vn) => (
                  <SelectItem key={vn.id} value={vn.id} className="rounded-lg">
                    <div className="flex flex-col">
                      <span className="font-bold">{vn.name}</span>
                      <span className="text-[10px] text-gray-400">{vn.vehicleType?.name || 'Standard'}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scrap Yard Assignment */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
              <MapPin className="h-3.5 w-3.5 text-orange-500" />
              Work Zone (Scrap Yard)
            </Label>
            <Select value={scrapYardId} onValueChange={setScrapYardId} disabled={isLoading}>
              <SelectTrigger className="h-14 rounded-xl border-gray-200 focus:ring-orange-200 focus:border-orange-400 transition-all shadow-sm">
                <SelectValue placeholder="Assign Yard..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-100 shadow-2xl">
                <SelectItem value="none" className="text-gray-400 italic font-medium">No yard assigned</SelectItem>
                {availableScrapYards.filter((yard) => yard.isActive !== false).map((yard) => (
                  <SelectItem key={yard.id} value={yard.id} className="rounded-lg">
                    <div className="flex flex-col text-left">
                      <span className="font-bold">{yard.yardName}</span>
                      <span className="text-[10px] text-gray-400 line-clamp-1">{yard.address}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex gap-4 mt-8 transition-all hover:bg-blue-50">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Info className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-blue-900">Deployment Notice</h4>
            <p className="text-xs text-blue-700 leading-relaxed font-medium">
              Assigning a vehicle and scrap yard together optimizes route efficiency.
              The collector or crew will be notified of their update instantly in the mobile application.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}