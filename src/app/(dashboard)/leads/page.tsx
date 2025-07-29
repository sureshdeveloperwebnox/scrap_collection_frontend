'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LeadForm } from '@/components/lead-form';
import { Lead } from '@/types';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'John Smith',
    phone: '+61 400 123 456',
    email: 'john@example.com',
    vehicleType: 'car',
    scrapType: 'junk',
    address: '123 Main St, Sydney, NSW',
    status: 'new',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    phone: '+61 400 789 123',
    email: 'sarah@example.com',
    vehicleType: 'truck',
    scrapType: 'accident-damaged',
    address: '456 Oak Ave, Melbourne, VIC',
    status: 'contacted',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: '3',
    name: 'Mike Wilson',
    phone: '+61 400 456 789',
    email: 'mike@example.com',
    vehicleType: 'bike',
    scrapType: 'fully-scrap',
    address: '789 Pine Rd, Brisbane, QLD',
    status: 'qualified',
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>();

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.phone.includes(searchTerm) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateLead = (leadData: Partial<Lead>) => {
    const newLead: Lead = {
      ...leadData as Lead,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setLeads([...leads, newLead]);
  };

  const handleUpdateLead = (leadData: Partial<Lead>) => {
    setLeads(leads.map(lead => 
      lead.id === editingLead?.id 
        ? { ...lead, ...leadData, updatedAt: new Date() }
        : lead
    ));
    setEditingLead(undefined);
  };

  const handleDeleteLead = (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      setLeads(leads.filter(lead => lead.id !== id));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-gray-100 text-gray-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lead Management</h1>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Scrap Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>
                    <div>
                      <div>{lead.phone}</div>
                      <div className="text-sm text-gray-500">{lead.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{lead.vehicleType}</TableCell>
                  <TableCell className="capitalize">{lead.scrapType.replace('-', ' ')}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </TableCell>
                  <TableCell>{lead.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingLead(lead);
                          setIsFormOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLead(lead.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <LeadForm
        lead={editingLead}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingLead(undefined);
        }}
        onSubmit={editingLead ? handleUpdateLead : handleCreateLead}
      />
    </div>
  );
}