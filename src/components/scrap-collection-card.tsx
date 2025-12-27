'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Calendar, DollarSign, Package, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/utils/image-utils';
import { apiClient } from '@/lib/api/client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface ScrapCollectionRecord {
    id: string;
    collectionDate: string;
    scrapDescription: string;
    scrapCondition: string;
    quotedAmount: number;
    finalAmount: number;
    collectionStatus: string;
    weight?: number;
    quantity?: number;
    make?: string;
    model?: string;
    yearOfManufacture?: string;
    customerSignature?: string;
    collectorSignature?: string;
    photos?: string[];
    scrap_categories?: { id: string; name: string };
    scrap_names?: { id: string; name: string };
    Customer?: { id: string; name: string; phone: string };
    Employee?: { id: string; fullName: string; phone: string; email: string };
    Order?: { id: string; orderNumber: string };
}

interface ScrapCollectionCardProps {
    workOrderId: string;
}

export function ScrapCollectionCard({ workOrderId }: ScrapCollectionCardProps) {
    const [records, setRecords] = useState<ScrapCollectionRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState<ScrapCollectionRecord | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

    useEffect(() => {
        console.log('🚀 ScrapCollectionCard MOUNTED with workOrderId:', workOrderId);
        fetchRecords();
    }, [workOrderId]);

    const fetchRecords = async () => {
        try {
            console.log('📍 Fetching scrap collection records for workOrderId:', workOrderId);

            const response = await apiClient.get(`/scrap-collections/work-order/${workOrderId}`);

            console.log('✅ Response:', response.data);

            if (response.data.status === 'success') {
                console.log('✅ Records found:', response.data.data.records?.length || 0);
                setRecords(response.data.data.records || []);
            } else {
                console.error('❌ API returned error', response.data);
                toast.error(response.data.message || 'Failed to load forms');
            }
        } catch (error: any) {
            console.error('💥 Error fetching scrap collection records:', error);
            toast.error(error.message || 'Failed to load scrap collection forms');
        } finally {
            setIsLoading(false);
        }
    };

    const downloadPDF = async (recordId: string) => {
        try {
            const response = await apiClient.get(`/scrap-collections/${recordId}/pdf-data`);

            console.log('📄 PDF Response:', response.data);

            if (response.data.status === 'success' && response.data.data.html) {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(response.data.data.html);
                    printWindow.document.close();
                    printWindow.onload = () => {
                        setTimeout(() => {
                            printWindow.print();
                        }, 500);
                    };
                }
                toast.success('PDF opened in new window');
            } else {
                console.error('❌ Invalid PDF response:', response.data);
                toast.error('Failed to generate PDF');
            }
        } catch (error: any) {
            console.error('Error downloading PDF:', error);
            toast.error(error.message || 'Failed to generate PDF');
        }
    };

    const viewRecord = (record: ScrapCollectionRecord) => {
        setSelectedRecord(record);
        setIsViewDialogOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SUBMITTED':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'APPROVED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'REJECTED':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'COMPLETED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (isLoading) {
        return (
            <Card className="border-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.06)] bg-white overflow-hidden rounded-[2.5rem]">
                <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-400 to-purple-300" />
                <CardHeader className="pb-3 px-10 pt-8">
                    <CardTitle className="text-sm font-black text-gray-900 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-200 animate-pulse">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="uppercase tracking-[0.2em] text-[10px] text-purple-600">Collection Data</span>
                            <span className="text-xl tracking-tight">Loading...</span>
                        </div>
                    </CardTitle>
                </CardHeader>
            </Card>
        );
    }

    return (
        <>
            <Card className="border-none shadow-[0_25px_50px_-12px_rgba(0,0,0,0.06)] bg-white overflow-hidden rounded-[2.5rem] group">
                <div className="h-2 bg-gradient-to-r from-purple-500 via-pink-400 to-purple-300" />
                <CardHeader className="pb-3 px-10 pt-8">
                    <CardTitle className="text-sm font-black text-gray-900 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-200 group-hover:rotate-12 transition-transform duration-500">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="uppercase tracking-[0.2em] text-[10px] text-purple-600">Collection Data</span>
                            <span className="text-xl tracking-tight">Scrap Collection Forms</span>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-10 pb-10 pt-4">
                    {records.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                                <Package className="h-8 w-8 text-gray-300" />
                            </div>
                            <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">
                                No Collection Forms Submitted
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                                Forms will appear here once collectors submit them
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {records.map((record) => (
                                <div
                                    key={record.id}
                                    className="relative group/record p-6 rounded-[2rem] bg-gradient-to-br from-white to-purple-50/30 border border-purple-100 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover/record:bg-purple-500/10 transition-colors duration-500" />

                                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <Badge className={cn(
                                                    "px-3 py-1 text-[9px] font-black uppercase tracking-widest border",
                                                    getStatusColor(record.collectionStatus)
                                                )}>
                                                    {record.collectionStatus}
                                                </Badge>
                                                {record.scrap_categories && (
                                                    <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-lg">
                                                        {record.scrap_categories.name}
                                                    </span>
                                                )}
                                                {record.scrap_names && (
                                                    <span className="text-xs font-bold text-pink-600 bg-pink-50 px-3 py-1 rounded-lg">
                                                        {record.scrap_names.name}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-purple-400" />
                                                    <div>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Collection Date</p>
                                                        <p className="text-sm font-bold text-gray-900">
                                                            {new Date(record.collectionDate).toLocaleDateString('en-GB', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4 text-green-400" />
                                                    <div>
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Final Amount</p>
                                                        <p className="text-sm font-bold text-green-600">
                                                            ₹{record.finalAmount.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 shrink-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => viewRecord(record)}
                                                className="h-9 px-4 rounded-xl border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all"
                                            >
                                                <Eye className="w-4 h-4 mr-2 text-purple-500" />
                                                <span className="text-xs font-bold">View</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => downloadPDF(record.id)}
                                                className="h-9 px-4 rounded-xl border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all"
                                            >
                                                <Download className="w-4 h-4 mr-2 text-purple-500" />
                                                <span className="text-xs font-bold">PDF</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-purple-900 flex items-center gap-3">
                            <FileText className="h-6 w-6 text-purple-600" />
                            Scrap Collection Form Details
                        </DialogTitle>
                    </DialogHeader>

                    {selectedRecord && (
                        <div className="space-y-6 pt-4">
                            {/* Status & Category */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <Badge className={cn(
                                    "px-4 py-2 text-xs font-black uppercase tracking-widest border",
                                    getStatusColor(selectedRecord.collectionStatus)
                                )}>
                                    {selectedRecord.collectionStatus}
                                </Badge>
                                {selectedRecord.scrap_categories && (
                                    <span className="text-sm font-bold text-purple-600 bg-purple-50 px-4 py-2 rounded-lg border border-purple-200">
                                        {selectedRecord.scrap_categories.name}
                                    </span>
                                )}
                                {selectedRecord.scrap_names && (
                                    <span className="text-sm font-bold text-pink-600 bg-pink-50 px-4 py-2 rounded-lg border border-pink-200">
                                        {selectedRecord.scrap_names.name}
                                    </span>
                                )}
                            </div>

                            {/* Collector & Customer */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedRecord.Employee && (
                                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                                        <p className="text-xs font-black text-blue-900 uppercase tracking-widest mb-3">Collector</p>
                                        <p className="text-base font-bold text-gray-900">{selectedRecord.Employee.fullName}</p>
                                        <p className="text-sm text-gray-600">{selectedRecord.Employee.phone}</p>
                                        <p className="text-sm text-gray-600">{selectedRecord.Employee.email}</p>
                                    </div>
                                )}

                                {selectedRecord.Customer && (
                                    <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                                        <p className="text-xs font-black text-green-900 uppercase tracking-widest mb-3">Customer</p>
                                        <p className="text-base font-bold text-gray-900">{selectedRecord.Customer.name}</p>
                                        <p className="text-sm text-gray-600">{selectedRecord.Customer.phone}</p>
                                    </div>
                                )}
                            </div>

                            {/* Scrap Details */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                                    <p className="text-xs font-black text-purple-900 uppercase tracking-widest mb-2">Date</p>
                                    <p className="text-base font-bold text-gray-900">
                                        {new Date(selectedRecord.collectionDate).toLocaleDateString('en-GB')}
                                    </p>
                                </div>

                                {selectedRecord.weight && (
                                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                                        <p className="text-xs font-black text-purple-900 uppercase tracking-widest mb-2">Weight</p>
                                        <p className="text-base font-bold text-gray-900">{selectedRecord.weight} kg</p>
                                    </div>
                                )}

                                {selectedRecord.quantity && (
                                    <div className="p-4 rounded-xl bg-pink-50 border border-pink-200">
                                        <p className="text-xs font-black text-pink-900 uppercase tracking-widest mb-2">Quantity</p>
                                        <p className="text-base font-bold text-gray-900">{selectedRecord.quantity}</p>
                                    </div>
                                )}

                                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                                    <p className="text-xs font-black text-orange-900 uppercase tracking-widest mb-2">Condition</p>
                                    <p className="text-base font-bold text-gray-900">{selectedRecord.scrapCondition}</p>
                                </div>
                            </div>

                            {/* Vehicle Details */}
                            {(selectedRecord.make || selectedRecord.model || selectedRecord.yearOfManufacture) && (
                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                                    <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-3">Vehicle Details</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        {selectedRecord.make && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Make</p>
                                                <p className="text-base font-bold text-gray-900">{selectedRecord.make}</p>
                                            </div>
                                        )}
                                        {selectedRecord.model && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Model</p>
                                                <p className="text-base font-bold text-gray-900">{selectedRecord.model}</p>
                                            </div>
                                        )}
                                        {selectedRecord.yearOfManufacture && (
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Year</p>
                                                <p className="text-base font-bold text-gray-900">{selectedRecord.yearOfManufacture}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            {selectedRecord.scrapDescription && (
                                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                                    <p className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-2">Description</p>
                                    <p className="text-sm text-gray-700 leading-relaxed">{selectedRecord.scrapDescription}</p>
                                </div>
                            )}

                            {/* Pricing */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                                    <p className="text-xs font-black text-yellow-900 uppercase tracking-widest mb-2">Quoted Amount</p>
                                    <p className="text-2xl font-bold text-yellow-700">₹{selectedRecord.quotedAmount.toFixed(2)}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                                    <p className="text-xs font-black text-green-900 uppercase tracking-widest mb-2">Final Amount</p>
                                    <p className="text-2xl font-bold text-green-700">₹{selectedRecord.finalAmount.toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Photos */}
                            {selectedRecord.photos && selectedRecord.photos.length > 0 && (
                                <div>
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3">
                                        Photos ({selectedRecord.photos.length})
                                    </p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {selectedRecord.photos.map((photo, idx) => (
                                            <a
                                                key={idx}
                                                href={getImageUrl(photo)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group relative aspect-video rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all"
                                            >
                                                <img
                                                    src={getImageUrl(photo)}
                                                    alt={`Photo ${idx + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Signatures */}
                            <div className="grid grid-cols-2 gap-4">
                                {selectedRecord.customerSignature && (
                                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                                        <p className="text-xs font-black text-blue-900 uppercase tracking-widest mb-3">Customer Signature</p>
                                        <img
                                            src={getImageUrl(selectedRecord.customerSignature)}
                                            alt="Customer Signature"
                                            className="w-full max-w-[250px] h-auto border-2 border-blue-300 rounded-lg bg-white p-3"
                                        />
                                    </div>
                                )}
                                {selectedRecord.collectorSignature && (
                                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                                        <p className="text-xs font-black text-purple-900 uppercase tracking-widest mb-3">Collector Signature</p>
                                        <img
                                            src={getImageUrl(selectedRecord.collectorSignature)}
                                            alt="Collector Signature"
                                            className="w-full max-w-[250px] h-auto border-2 border-purple-300 rounded-lg bg-white p-3"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Download Button */}
                            <div className="flex justify-end pt-4 border-t">
                                <Button
                                    onClick={() => downloadPDF(selectedRecord.id)}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
