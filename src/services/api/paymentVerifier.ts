import axios from '../../utils/axiosInstance';
// Types based on Payment Model
export interface Payment {
    _id: string;
    user: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        phoneNumber: string;
    };
    event: {
        _id: string;
        title: string;
    };
    amount: number;
    quantity: number;
    paymentCode: string;
    orderCode: string; // Add orderCode to type definition
    status: 'pending' | 'verified' | 'failed' | 'expired' | 'cancelled';
    paymentMethod: 'manual_transfer';
    receiptImage: string;
    createdAt: string;
    manualBankAccount?: {
        bankName: string;
        accountNumber: string;
        accountHolderName: string;
    }
}

export const getPendingManualPayments = async () => {
    return await axios.get<Payment[]>('/manual-payments/pending');
};

export const verifyManualPayment = async (paymentId: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    return await axios.post('/manual-payments/verify', {
        paymentId,
        action,
        rejectionReason
    });
};
