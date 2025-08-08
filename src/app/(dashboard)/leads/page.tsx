'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LeadForm } from '@/components/lead-form';
import { Lead } from '@/types';
import { Plus, Search, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useLeads, useDeleteLead } from '@/hooks/use-leads';
import { toast } from 'sonner';

// API response type
interface ApiLead {
  id: number;
  organizationId: number;
  name: string;
  contact: string;
  email: string;
  location: string;
  vehicleTypeId: number;
  scrapCategory: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  vehicleType: {
    id: number;
    name: string;
    description: string;
  };
  organization: {
    name: string;
  };
}

interface ApiResponse {
  version: string;
  validationErrors: any[];
  code: number;
  status: string;
  message: string;
  data: {
    leads: ApiLead[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function LeadsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>();

  // API hooks
  const { data: leadsData, isLoading, error } = useLeads({
    search: searchTerm || undefined,
    limit: 100, // Adjust based on your needs
  });

  const deleteLeadMutation = useDeleteLead();

  // Handle the actual API response structure
  const apiResponse = leadsData as unknown as ApiResponse;
  console.log('====================================');
  console.log("leadsData", leadsData);
  console.log('====================================');
  const leads = apiResponse?.data?.leads || [];
  const totalLeads = apiResponse?.data?.pagination?.total || 0;

  const handleDeleteLead = async (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      try {
        await deleteLeadMutation.mutateAsync(id);
        toast.success('Lead deleted successfully!');
      } catch (error) {
        console.error('Error deleting lead:', error);
        toast.error('Failed to delete lead');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600">Error loading leads</h2>
          <p className="text-gray-600 mt-2">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lead Management</h1>
          <p className="text-gray-600 mt-1">
            {isLoading ? 'Loading...' : `${totalLeads} total leads`}
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Lead
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Leads</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading leads...</span>
            </div>
          ) : leads?.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No leads found.</p>
              {searchTerm && (
                <p className="text-sm text-gray-500 mt-1">
                  Try adjusting your search terms.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Vehicle Type</TableHead>
                    <TableHead>Scrap Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>
                        <div>
                          <div>{lead.contact}</div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{lead.vehicleType?.name || 'N/A'}</TableCell>
                      <TableCell className="capitalize">{String(lead.scrapCategory || '').replace(/_/g, ' ')}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(lead.status)}`}>
                          {lead.status.toLowerCase()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              // Convert API lead to our Lead type for editing
                              const convertedLead: Lead = {
                                id: lead.id.toString(),
                                organizationId: lead.organizationId,
                                name: lead.name,
                                contact: lead.contact,
                                email: lead.email,
                                vehicleTypeId: lead.vehicleTypeId,
                                scrapCategory: lead.scrapCategory,
                                address: lead.location,
                                status: lead.status.toLowerCase() as any,
                                createdAt: new Date(lead.createdAt),
                                updatedAt: new Date(lead.updatedAt),
                              } as unknown as Lead;
                              setEditingLead(convertedLead);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLead(lead.id.toString())}
                            disabled={deleteLeadMutation.isPending}
                          >
                            {deleteLeadMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <LeadForm
        lead={editingLead}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingLead(undefined);
        }}
      />
    </div>
  );
}