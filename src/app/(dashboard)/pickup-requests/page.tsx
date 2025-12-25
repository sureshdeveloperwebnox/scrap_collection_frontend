'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PickupRequest, PickupRequestStatus } from '@/types';
import { Plus, Search, Edit2, Trash2, MapPin, User, Loader2 } from 'lucide-react';
import { usePickupRequests, useDeletePickupRequest, useAssignPickupRequest } from '@/hooks/use-pickup-requests';
import { useEmployees } from '@/hooks/use-employees';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { DeleteConfirmDialog } from '@/components/delete-confirm-dialog';

export default function PickupRequestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const { data: pickupRequestsData, isLoading } = usePickupRequests();
  const { data: employeesData } = useEmployees({ role: 'COLLECTOR' });
  const deleteMutation = useDeletePickupRequest();
  const assignMutation = useAssignPickupRequest();
  const [requestToDelete, setRequestToDelete] = useState<PickupRequest | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const pickupRequests = pickupRequestsData?.data?.pickupRequests || [];
  const employees = employeesData?.data?.employees || [];

  const filteredRequests = pickupRequests.filter(req => {
    const matchesSearch = !searchTerm ||
      req.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (request: PickupRequest) => {
    setRequestToDelete(request);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!requestToDelete) return;
    try {
      await deleteMutation.mutateAsync(requestToDelete.id);
      toast.success('Pickup request deleted');
      setIsDeleteConfirmOpen(false);
      setRequestToDelete(null);
    } catch (error) {
      toast.error('Failed to delete pickup request');
    }
  };

  const handleAssign = async (requestId: string, collectorId: string) => {
    try {
      await assignMutation.mutateAsync({ requestId, collectorId });
      toast.success('Pickup request assigned');
    } catch (error) {
      toast.error('Failed to assign pickup request');
    }
  };

  const getStatusColor = (status: PickupRequestStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'IN_TRANSIT': return 'bg-orange-100 text-orange-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pickup Requests</h1>
          <p className="text-gray-600 mt-1">
            {isLoading ? 'Loading...' : `${filteredRequests.length} Total Requests`}
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Request
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pickupRequests.filter(r => r.status === 'PENDING').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">
              {pickupRequests.filter(r => r.status === 'ASSIGNED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {pickupRequests.filter(r => r.status === 'IN_TRANSIT').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {pickupRequests.filter(r => r.status === 'COMPLETED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {pickupRequests.filter(r => r.status === 'CANCELLED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton columnCount={7} rowCount={10} />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No pickup requests found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Pickup Address</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">#{request.id.slice(0, 8)}</TableCell>
                    <TableCell>{request.customerId}</TableCell>
                    <TableCell>
                      {request.vehicleDetails.make} {request.vehicleDetails.model}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="mr-1 h-3 w-3 text-gray-400" />
                        <span className="truncate max-w-[200px]">{request.pickupAddress}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.assignedTo ? (
                        <div className="flex items-center">
                          <User className="mr-1 h-3 w-3 text-gray-400" />
                          {request.assignedTo}
                        </div>
                      ) : (
                        <Select
                          onValueChange={(collectorId) => handleAssign(request.id, collectorId)}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Assign" />
                          </SelectTrigger>
                          <SelectContent>
                            {employees.map((emp) => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(request)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setRequestToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Pickup Request"
        description="Are you sure you want to delete this pickup request? This action cannot be undone."
        confirmText="Delete Request"
        isLoading={deleteMutation.isPending}
        itemTitle={`Request #${requestToDelete?.id.slice(0, 8)}`}
        itemSubtitle={requestToDelete?.pickupAddress}
        icon={requestToDelete && (
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shadow-sm border border-orange-100">
            <MapPin className="h-5 w-5 text-orange-600" />
          </div>
        )}
      />
    </div >
  );
}
