import axios from '../../utils/axiosInstance';
// Basic types needed for Finance
export interface User {
    _id: string;
    username: string;
    email: string;
    firstname?: string;
    lastname?: string;
}

export interface OrganizerDetails {
    companyName: string;
    commissionRate: number;
}

export interface Event {
    _id: string;
    title: string;
    location: string;
    startDate: string;
    endDate: string;
}

export interface RevenueReport {
    _id: string;
    transactionAmount: number;
    commissionAmount: number;
    organizerAmount: number;
    commissionRate: number;
    transactionDate: string;
    paymentCode: string;
    orderCode: string;
    createdAt: string;
    event: Event;
    user: User;
    organizer?: User; // Depending on population depth
    paymentMethod: 'chapa' | 'bank_transfer' | 'manual_transfer';
    settlementStatus: 'Settled' | 'Unsettled';
    settledBy?: string;
    settledAt?: string;
}

export interface RevenueSummary {
    totalTransactions: number;
    totalRevenue: number;
    totalCommission: number;
    totalOrganizerAmount: number;
}

export interface RevenueResponse {
    status: number;
    message: string;
    data: {
        reports: RevenueReport[];
        summary: RevenueSummary;
    };
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export const getOrganizerRevenueReports = async (
    params: {
        page?: number;
        limit?: number;
        startDate?: string;
        endDate?: string;
        type?: 'payable' | 'receivable';
        status?: 'Settled' | 'Unsettled';
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }
): Promise<RevenueResponse> => {
    const response = await axios.get('/organizer-revenue', { params });
    return response.data;
};

export const settleOrganizerReport = async (reportId: string): Promise<any> => {
    const response = await axios.put(`/organizer-revenue/${reportId}/settle`);
    return response.data;
};

// SuperAdmin Finance Services (Reusing existing endpoints if needed or adding specific ones)
// Assuming SA endpoints are in superadmin routes but can be accessed via specific service functions
// Logic for SA settlement is in superadminController.markReportAsSettled

export const getSuperAdminRevenueReport = async (
    params: {
        page?: number;
        limit?: number;
        organizerId?: string;
        startDate?: string;
        endDate?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    }
): Promise<any> => {
    const response = await axios.get('/superadmin/revenue-reports', { params });
    // Filter for "Collections" (Manual) vs "Payouts" (Chapa) is done client-side or
    // we should update backend to support type filter for SA too. 
    // For now, SA gets all.
    return response.data;
};


export const settleSuperAdminReport = async (reportId: string): Promise<any> => {
    const response = await axios.put(`/superadmin/revenue-reports/${reportId}/settle`);
    return response.data;
};
