'use client';

import { useState, useEffect, useMemo } from 'react';
import { useVehicleTypes, useCreateVehicleType, useUpdateVehicleType, useDeleteVehicleType, useVehicleTypeStats } from '@/hooks/use-vehicle-types';
import { useVehicleNames, useCreateVehicleName, useUpdateVehicleName, useDeleteVehicleName, useVehicleNameStats } from '@/hooks/use-vehicle-names';
import { VehicleName } from '@/types';
import { VehicleType } from '@/lib/api/vehicleTypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import { RowsPerPage } from '@/components/ui/rows-per-page';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, Loader2, CheckCircle2, ChevronDown, MoreHorizontal, X, Car, List, Shield, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { useAuthStore } from '@/lib/store/auth-store';
import { VehicleTypeForm } from '@/components/vehicle-type-form';

// Dynamically import Lottie
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// No Data Animation Component
function NoDataAnimation({ message = 'No data found' }: { message?: string }) {
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
        </div>
    );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
    return (
        <span className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300",
            isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
        )}>
            {isActive ? <CheckCircle2 className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
            {isActive ? 'Active' : 'Inactive'}
        </span>
    );
}

type MainTabKey = 'names' | 'types';
type StatusTabKey = 'all' | 'active' | 'inactive';

export default function VehiclesPage() {
    const { user } = useAuthStore();
    const [activeMainTab, setActiveMainTab] = useState<MainTabKey>('names');

    // Names state
    const [nameSearch, setNameSearch] = useState('');
    const [debouncedNameSearch, setDebouncedNameSearch] = useState('');
    const [namePage, setNamePage] = useState(1);
    const [nameLimit, setNameLimit] = useState(10);
    const [nameStatusFilter, setNameStatusFilter] = useState<StatusTabKey>('all');
    const [isNameFormOpen, setIsNameFormOpen] = useState(false);
    const [editingName, setEditingName] = useState<VehicleName | undefined>();

    // Types state
    const [typeSearch, setTypeSearch] = useState('');
    const [debouncedTypeSearch, setDebouncedTypeSearch] = useState('');
    const [typePage, setTypePage] = useState(1);
    const [typeLimit, setTypeLimit] = useState(10);
    const [typeStatusFilter, setTypeStatusFilter] = useState<StatusTabKey>('all');
    const [isTypeFormOpen, setIsTypeFormOpen] = useState(false);
    const [editingType, setEditingType] = useState<VehicleType | undefined>();

    // UI state
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Debounce searches
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedNameSearch(nameSearch);
            setNamePage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [nameSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTypeSearch(typeSearch);
            setTypePage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [typeSearch]);

    // Queries
    const { data: namesData, isLoading: namesLoading, error: namesError, refetch: refetchNames } = useVehicleNames({
        page: namePage,
        limit: nameLimit,
        search: debouncedNameSearch || undefined,
        isActive: nameStatusFilter === 'all' ? undefined : nameStatusFilter === 'active',
    });

    const { data: nameStats } = useVehicleNameStats();

    const { data: typesData, isLoading: typesLoading, error: typesError, refetch: refetchTypes } = useVehicleTypes({
        page: typePage,
        limit: typeLimit,
        search: debouncedTypeSearch || undefined,
        isActive: typeStatusFilter === 'all' ? undefined : typeStatusFilter === 'active',
    } as any);

    // Fetch ALL types for select dropdown in name form
    const { data: allTypesData } = useVehicleTypes({ page: 1, limit: 1000 } as any);

    const { data: typeStats } = useVehicleTypeStats();

    // Mutations
    const createNameMutation = useCreateVehicleName();
    const updateNameMutation = useUpdateVehicleName();
    const deleteNameMutation = useDeleteVehicleName();

    const createTypeMutation = useCreateVehicleType();
    const updateTypeMutation = useUpdateVehicleType();
    const deleteTypeMutation = useDeleteVehicleType();

    // Data processing
    const names = useMemo(() => (namesData as any)?.data?.vehicleNames || [], [namesData]);
    const namePagination = useMemo(() => (namesData as any)?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }, [namesData]);

    const types = useMemo(() => (typesData as any)?.data?.vehicleTypes || [], [typesData]);
    const typePagination = useMemo(() => (typesData as any)?.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }, [typesData]);

    const allTypes = useMemo(() => (allTypesData as any)?.data?.vehicleTypes || [], [allTypesData]);

    // Handlers
    const handleDeleteName = async (id: string) => {
        if (confirm('Are you sure you want to delete this vehicle?')) {
            try {
                await deleteNameMutation.mutateAsync(id);
                toast.success('Vehicle deleted successfully');
            } catch (error: any) {
                toast.error(error?.response?.data?.message || 'Failed to delete vehicle');
            }
        }
    };

    const handleToggleNameStatus = async (vehicle: VehicleName, checked: boolean) => {
        try {
            await updateNameMutation.mutateAsync({
                id: vehicle.id,
                data: { isActive: checked }
            });
            toast.success(`Vehicle ${checked ? 'activated' : 'deactivated'} successfully`);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to update status');
        }
    };

    const handleDeleteType = async (id: string) => {
        if (confirm('Are you sure you want to delete this vehicle type?')) {
            try {
                await deleteTypeMutation.mutateAsync(id.toString());
                toast.success('Vehicle type deleted successfully');
            } catch (error: any) {
                toast.error(error?.response?.data?.message || 'Failed to delete vehicle type');
            }
        }
    };

    const handleToggleTypeStatus = async (type: VehicleType, checked: boolean) => {
        try {
            await updateTypeMutation.mutateAsync({
                id: type.id.toString(),
                data: { isActive: checked }
            });
            toast.success(`Vehicle type ${checked ? 'activated' : 'deactivated'} successfully`);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to update status');
        }
    };

    const handleNameSubmit = async (formData: any) => {
        try {
            if (editingName) {
                await updateNameMutation.mutateAsync({
                    id: editingName.id,
                    data: formData
                });
                toast.success('Vehicle updated successfully');
            } else {
                await createNameMutation.mutateAsync({
                    ...formData,
                    organizationId: user?.organizationId
                });
                toast.success('Vehicle created successfully');
            }
            setIsNameFormOpen(false);
            setEditingName(undefined);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to save vehicle');
        }
    };

    const currentSearch = activeMainTab === 'names' ? nameSearch : typeSearch;
    const setCurrentSearch = activeMainTab === 'names' ? setNameSearch : setTypeSearch;

    if (namesError || typesError) {
        return <div className="p-6 text-center text-red-600">Error loading data. Please try again.</div>;
    }

    return (
        <div className="space-y-6">
            <Card className="bg-white shadow-sm border border-gray-200 rounded-lg">
                <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <CardTitle className="text-xl font-bold text-gray-900">Vehicle Management</CardTitle>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => { setActiveMainTab('names'); setIsSearchOpen(false); }}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeMainTab === 'names' ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Vehicles
                                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${activeMainTab === 'names' ? 'bg-cyan-100 text-cyan-700' : 'bg-gray-200 text-gray-600'}`}>
                                        {namePagination.total}
                                    </span>
                                </button>
                                <button
                                    onClick={() => { setActiveMainTab('types'); setIsSearchOpen(false); }}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeMainTab === 'types' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Types
                                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${activeMainTab === 'types' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'}`}>
                                        {typePagination.total}
                                    </span>
                                </button>
                            </div>

                            <Button variant="outline" size="sm" onClick={() => setIsSearchOpen(!isSearchOpen)} className="h-9 w-9 p-0 border-gray-200"><Search className="h-4 w-4" /></Button>

                            {isSearchOpen && (
                                <div className="relative">
                                    <Input
                                        placeholder="Search..."
                                        value={currentSearch}
                                        onChange={(e) => setCurrentSearch(e.target.value)}
                                        onBlur={() => { if (!currentSearch) setIsSearchOpen(false); }}
                                        autoFocus
                                        className="w-64 pl-10 pr-10 h-9 rounded-lg"
                                    />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    {currentSearch && <button onClick={() => { setCurrentSearch(''); setIsSearchOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-gray-400" /></button>}
                                </div>
                            )}

                            <Button
                                onClick={() => {
                                    if (activeMainTab === 'names') { setEditingName(undefined); setIsNameFormOpen(true); }
                                    else { setEditingType(undefined); setIsTypeFormOpen(true); }
                                }}
                                className="bg-cyan-500 hover:bg-cyan-600 text-white h-9 w-9 p-0"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {!mounted ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-white">
                                    <TableRow className="hover:bg-transparent border-b-2 border-gray-200 bg-gray-50">
                                        <TableHead colSpan={activeMainTab === 'names' ? 7 : 4} className="p-0 bg-transparent">
                                            <div className="flex items-center gap-1 px-2 py-2">
                                                {(['all', 'active', 'inactive'] as StatusTabKey[]).map((status) => {
                                                    const isCurrentStatus = activeMainTab === 'names' ? nameStatusFilter === status : typeStatusFilter === status;
                                                    let count = 0;
                                                    if (activeMainTab === 'names') {
                                                        if (status === 'all') count = (nameStats as any)?.total || 0;
                                                        else if (status === 'active') count = (nameStats as any)?.active || 0;
                                                        else count = (nameStats as any)?.inactive || 0;
                                                    } else {
                                                        if (status === 'all') count = (typeStats as any)?.total || 0;
                                                        else if (status === 'active') count = (typeStats as any)?.active || 0;
                                                        else count = (typeStats as any)?.inactive || 0;
                                                    }

                                                    const colors = activeMainTab === 'names' ? { text: 'text-cyan-700', bg: 'bg-cyan-50', line: 'bg-cyan-500' } : { text: 'text-purple-700', bg: 'bg-purple-50', line: 'bg-purple-500' };

                                                    return (
                                                        <button
                                                            key={status}
                                                            onClick={() => {
                                                                if (activeMainTab === 'names') { setNameStatusFilter(status); setNamePage(1); }
                                                                else { setTypeStatusFilter(status); setTypePage(1); }
                                                            }}
                                                            className={`relative px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${isCurrentStatus ? `${colors.text} ${colors.bg}` : 'text-gray-500 hover:bg-gray-100'}`}
                                                        >
                                                            <span className="capitalize">{status}</span>
                                                            <span className="ml-2 text-xs opacity-70">{count}</span>
                                                            {isCurrentStatus && <span className={`absolute left-0 right-0 bottom-0 h-0.5 ${colors.line}`} />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </TableHead>
                                    </TableRow>
                                    <TableRow className="hover:bg-transparent border-b">
                                        <TableHead className="w-12"><Checkbox className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" /></TableHead>
                                        {activeMainTab === 'names' ? (
                                            <>
                                                <TableHead>Vehicle Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Number</TableHead>
                                                <TableHead>Make/Model</TableHead>
                                                <TableHead>Status</TableHead>
                                            </>
                                        ) : (
                                            <>
                                                <TableHead>Vehicle Type</TableHead>
                                                <TableHead>Status</TableHead>
                                            </>
                                        )}
                                        <TableHead className="text-right pr-6">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeMainTab === 'names' ? (
                                        namesLoading ? <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" /></TableCell></TableRow> :
                                            names.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-12"><NoDataAnimation message="No vehicles found" /></TableCell></TableRow> :
                                                names.map((v: VehicleName) => (
                                                    <TableRow key={v.id} className="hover:bg-gray-50">
                                                        <TableCell><Checkbox className="data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500" /></TableCell>
                                                        <TableCell className="font-semibold text-gray-900">{v.name}</TableCell>
                                                        <TableCell>{v.vehicleType?.name || 'N/A'}</TableCell>
                                                        <TableCell>{v.vehicleNumber || '-'}</TableCell>
                                                        <TableCell>{v.make || '-'} {v.model || ''}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Switch checked={v.isActive} onCheckedChange={(c) => handleToggleNameStatus(v, c)} className="data-[state=checked]:bg-green-500" />
                                                                <StatusBadge isActive={v.isActive} />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => { setEditingName(v); setIsNameFormOpen(true); }}><Edit2 className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleDeleteName(v.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                    ) : (
                                        typesLoading ? <TableRow><TableCell colSpan={4} className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" /></TableCell></TableRow> :
                                            types.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-12"><NoDataAnimation message="No vehicle types found" /></TableCell></TableRow> :
                                                types.map((t: VehicleType) => (
                                                    <TableRow key={t.id} className="hover:bg-gray-50">
                                                        <TableCell><Checkbox className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500" /></TableCell>
                                                        <TableCell className="font-semibold text-gray-900">{t.name}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Switch checked={t.isActive} onCheckedChange={(c) => handleToggleTypeStatus(t, c)} className="data-[state=checked]:bg-green-500" />
                                                                <StatusBadge isActive={t.isActive} />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => { setEditingType(t); setIsTypeFormOpen(true); }}><Edit2 className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleDeleteType(t.id.toString())} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                        <RowsPerPage
                            value={activeMainTab === 'names' ? nameLimit : typeLimit}
                            onChange={(v) => { if (activeMainTab === 'names') { setNameLimit(v); setNamePage(1); } else { setTypeLimit(v); setTypePage(1); } }}
                            options={[5, 10, 20, 50]}
                        />
                        <div className="text-xs text-gray-500 font-medium">
                            Showing {activeMainTab === 'names'
                                ? `${((namePagination.page - 1) * namePagination.limit) + 1} to ${Math.min(namePagination.page * namePagination.limit, namePagination.total)} of ${namePagination.total} vehicles`
                                : `${((typePagination.page - 1) * typePagination.limit) + 1} to ${Math.min(typePagination.page * typePagination.limit, typePagination.total)} of ${typePagination.total} types`
                            }
                        </div>
                        <Pagination
                            currentPage={activeMainTab === 'names' ? namePagination.page : typePagination.page}
                            totalPages={activeMainTab === 'names' ? namePagination.totalPages : typePagination.totalPages}
                            onPageChange={(p) => { if (activeMainTab === 'names') setNamePage(p); else setTypePage(p); }}
                        />
                    </div>
                </CardContent>
            </Card>

            <VehicleTypeForm
                vehicleType={editingType}
                isOpen={isTypeFormOpen}
                onClose={() => { setIsTypeFormOpen(false); setEditingType(undefined); }}
            />

            {/* Name Form Dialog */}
            <Dialog open={isNameFormOpen} onOpenChange={setIsNameFormOpen}>
                <DialogContent className="w-[95vw] sm:max-w-[800px] max-h-[95vh] bg-white border-0 shadow-2xl rounded-2xl p-0 flex flex-col [&>button]:hidden">
                    <DialogHeader className="px-8 pt-8 pb-6 border-b border-gray-200 flex-shrink-0">
                        <div className="flex items-start justify-between">
                            <div>
                                <DialogTitle className="text-2xl font-bold text-gray-900">{editingName ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
                                <p className="text-sm text-gray-600 mt-2">{editingName ? 'Update vehicle details' : 'Add a new vehicle to the fleet'}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" onClick={() => setIsNameFormOpen(false)} className="rounded-xl">Cancel</Button>
                                <Button type="submit" form="vehicle-name-form" className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl">Save</Button>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto min-h-0">
                        <VehicleNameFormInternal
                            vehicleName={editingName}
                            vehicleTypes={allTypes}
                            onSubmit={handleNameSubmit}
                            onCancel={() => setIsNameFormOpen(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function VehicleNameFormInternal({
    vehicleName,
    vehicleTypes,
    onSubmit,
    onCancel,
}: {
    vehicleName?: VehicleName;
    vehicleTypes: VehicleType[];
    onSubmit: (data: any) => void;
    onCancel: () => void;
}) {
    const [name, setName] = useState(vehicleName?.name || '');
    const [vehicleTypeId, setVehicleTypeId] = useState<string>(vehicleName?.vehicleTypeId.toString() || '');
    const [isActive, setIsActive] = useState(vehicleName?.isActive ?? true);
    const [vehicleNumber, setVehicleNumber] = useState(vehicleName?.vehicleNumber || '');
    const [make, setMake] = useState(vehicleName?.make || '');
    const [model, setModel] = useState(vehicleName?.model || '');
    const [year, setYear] = useState<string>(vehicleName?.year?.toString() || new Date().getFullYear().toString());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            vehicleTypeId: parseInt(vehicleTypeId),
            isActive,
            vehicleNumber: vehicleNumber || undefined,
            make: make || undefined,
            model: model || undefined,
            year: year ? parseInt(year) : undefined,
        });
    };

    return (
        <form id="vehicle-name-form" onSubmit={handleSubmit} className="px-8 pb-8 space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name">Vehicle Name *</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vehicleType">Vehicle Type *</Label>
                        <Select value={vehicleTypeId} onValueChange={setVehicleTypeId} required>
                            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent className="bg-white">
                                {vehicleTypes.map((vt) => <SelectItem key={vt.id} value={vt.id.toString()}>{vt.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2"><Label htmlFor="vehicleNumber">Vehicle Number</Label><Input id="vehicleNumber" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className="rounded-xl" /></div>
                </div>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="make">Make</Label><Input id="make" value={make} onChange={(e) => setMake(e.target.value)} className="rounded-xl" /></div>
                        <div className="space-y-2"><Label htmlFor="model">Model</Label><Input id="model" value={model} onChange={(e) => setModel(e.target.value)} className="rounded-xl" /></div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input id="year" type="number" value={year} onChange={(e) => setYear(e.target.value)} className="pl-10 rounded-xl" />
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50">
                        <Label htmlFor="isActive">Active Status</Label>
                        <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} className="data-[state=checked]:bg-green-500" />
                    </div>
                </div>
            </div>
        </form>
    );
}
