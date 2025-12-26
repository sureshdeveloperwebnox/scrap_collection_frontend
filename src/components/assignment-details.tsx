'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/Separator';
import {
    User,
    Users,
    Clock,
    CheckCircle2,
    PlayCircle,
    FileText,
    Image as ImageIcon,
    Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface AssignmentDetailsProps {
    assignments: Array<{
        id: string;
        status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
        assignedAt: Date;
        startTime?: Date;
        endTime?: Date;
        completedAt?: Date;
        completionNotes?: string;
        completionPhotos?: string[];
        notes?: string;
        collector?: {
            id: string;
            fullName: string;
            email: string;
            phone?: string;
        };
        crew?: {
            id: string;
            name: string;
            members?: Array<{
                id: string;
                fullName: string;
                email: string;
            }>;
        };
    }>;
}

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'PENDING':
            return {
                label: 'Pending',
                color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
                icon: Clock,
                iconColor: 'text-yellow-600',
            };
        case 'IN_PROGRESS':
            return {
                label: 'In Progress',
                color: 'bg-blue-100 text-blue-700 border-blue-200',
                icon: PlayCircle,
                iconColor: 'text-blue-600',
            };
        case 'COMPLETED':
            return {
                label: 'Completed',
                color: 'bg-green-100 text-green-700 border-green-200',
                icon: CheckCircle2,
                iconColor: 'text-green-600',
            };
        default:
            return {
                label: status,
                color: 'bg-gray-100 text-gray-700 border-gray-200',
                icon: Clock,
                iconColor: 'text-gray-600',
            };
    }
};

export function AssignmentDetails({ assignments }: AssignmentDetailsProps) {
    if (!assignments || assignments.length === 0) {
        return (
            <Card className="border-none shadow-sm bg-white">
                <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/30">
                    <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <Users className="h-4 w-4 text-cyan-500" />
                        Assigned Personnel
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm font-medium">No assignments yet</p>
                        <p className="text-xs text-gray-400 mt-1">Assign collectors or crews to this order</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-sm bg-white">
            <CardHeader className="pb-3 border-b border-gray-50 bg-gray-50/30">
                <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan-500" />
                    Assigned Personnel
                    <Badge variant="secondary" className="ml-auto">
                        {assignments.length} {assignments.length === 1 ? 'Assignment' : 'Assignments'}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
                {assignments.map((assignment, index) => {
                    const statusConfig = getStatusConfig(assignment.status);
                    const StatusIcon = statusConfig.icon;
                    const isCollector = !!assignment.collector;
                    const isCompleted = assignment.status === 'COMPLETED';

                    return (
                        <div key={assignment.id}>
                            {index > 0 && <Separator className="my-4" />}

                            <div className="space-y-4">
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-10 w-10 rounded-xl flex items-center justify-center",
                                            isCollector ? "bg-cyan-50" : "bg-purple-50"
                                        )}>
                                            {isCollector ? (
                                                <User className="h-5 w-5 text-cyan-600" />
                                            ) : (
                                                <Users className="h-5 w-5 text-purple-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {isCollector ? assignment.collector?.fullName : assignment.crew?.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {isCollector ? 'Collector' : `Crew • ${assignment.crew?.members?.length || 0} members`}
                                            </p>
                                        </div>
                                    </div>

                                    <Badge className={cn("border", statusConfig.color)}>
                                        <StatusIcon className={cn("h-3 w-3 mr-1", statusConfig.iconColor)} />
                                        {statusConfig.label}
                                    </Badge>
                                </div>

                                {/* Assignment Notes */}
                                {assignment.notes && (
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <FileText className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-xs font-semibold text-blue-900 mb-1">Assignment Notes</p>
                                                <p className="text-sm text-blue-800">{assignment.notes}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Completion Details */}
                                {isCompleted && (
                                    <div className="space-y-3 border-t border-gray-100 pt-4">
                                        {assignment.completionNotes && (
                                            <div className="bg-green-50/50 border border-green-100 rounded-lg p-3">
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-xs font-semibold text-green-900 mb-1">Completion Notes</p>
                                                        <p className="text-sm text-green-800">{assignment.completionNotes}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {assignment.completionPhotos && assignment.completionPhotos.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <ImageIcon className="h-4 w-4 text-gray-600" />
                                                    <p className="text-xs font-semibold text-gray-700">
                                                        Completion Photos ({assignment.completionPhotos.length})
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {assignment.completionPhotos.map((photo, photoIndex) => (
                                                        <a
                                                            key={photoIndex}
                                                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9645'}/uploads/${photo}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 hover:ring-2 hover:ring-cyan-500 transition-all"
                                                        >
                                                            <img
                                                                src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9645'}/uploads/${photo}`}
                                                                alt={`Completion photo ${photoIndex + 1}`}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Crew Members */}
                                {!isCollector && assignment.crew?.members && assignment.crew.members.length > 0 && (
                                    <div className="bg-purple-50/30 border border-purple-100 rounded-lg p-3">
                                        <p className="text-xs font-semibold text-purple-900 mb-2">Crew Members</p>
                                        <div className="space-y-2">
                                            {assignment.crew.members.map((member) => (
                                                <div key={member.id} className="flex items-center gap-2 text-sm">
                                                    <div className="h-6 w-6 rounded-full bg-purple-200 flex items-center justify-center">
                                                        <User className="h-3.5 w-3.5 text-purple-700" />
                                                    </div>
                                                    <span className="text-purple-900 font-medium">{member.fullName}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
