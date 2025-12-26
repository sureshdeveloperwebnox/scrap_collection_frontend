import { apiClient } from './client';

export interface AssignmentStatus {
    id: string;
    orderId: string;
    collectorId?: string;
    crewId?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    assignedAt: string;
    startTime?: string;
    endTime?: string;
    completedAt?: string;
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
    order?: {
        id: string;
        orderNumber: string;
        customerName: string;
        address: string;
        orderStatus: string;
    };
}

export const assignmentsApi = {
    /**
     * Get assignment by ID
     */
    getAssignment: async (id: string) => {
        const response = await apiClient.get(`/assignments/${id}`);
        return response.data;
    },

    /**
     * Get all assignments for a collector
     */
    getCollectorAssignments: async (collectorId: string, status?: string) => {
        const params = status ? { status } : {};
        const response = await apiClient.get(`/assignments/collector/${collectorId}`, { params });
        return response.data;
    },

    /**
     * Get all assignments for a crew
     */
    getCrewAssignments: async (crewId: string, status?: string) => {
        const params = status ? { status } : {};
        const response = await apiClient.get(`/assignments/crew/${crewId}`, { params });
        return response.data;
    },

    /**
     * Start an assignment
     */
    startAssignment: async (data: {
        orderId: string;
        assignOrderId: string;
        collectorId?: string;
        crewId?: string;
    }) => {
        const response = await apiClient.post('/assignments/start', data);
        return response.data;
    },

    /**
     * Complete an assignment
     */
    completeAssignment: async (data: {
        orderId: string;
        assignOrderId: string;
        collectorId?: string;
        crewId?: string;
        completionNotes?: string;
        completionPhotos?: string[];
    }) => {
        const response = await apiClient.post('/assignments/complete', data);
        return response.data;
    },
};
