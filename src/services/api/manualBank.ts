import apiClient from '../../utils/axiosInstance';

export interface ManualBank {
    _id: string;
    bankName: string;
    shortName?: string;
    logo?: string;
    type: 'Bank' | 'MobileWallet';
    isActive: boolean;
}

export interface ManualBankAccount {
    _id: string;
    organizer: string;
    bank: ManualBank;
    accountNumber: string;
    accountHolderName: string;
    isVisible: boolean;
    createdAt: string;
}

export const getManualBanks = async (): Promise<ManualBank[]> => {
    const response = await apiClient.get('/manual-payments/banks');
    return response.data;
};

export const getOrganizerManualAccounts = async (): Promise<ManualBankAccount[]> => {
    const response = await apiClient.get('/manual-payments/accounts');
    return response.data;
};

export const addManualBankAccount = async (data: {
    bankId: string;
    accountNumber: string;
    accountHolderName: string;
}): Promise<ManualBankAccount> => {
    const response = await apiClient.post('/manual-payments/accounts', data);
    return response.data;
};

export const deleteManualBankAccount = async (accountId: string): Promise<void> => {
    await apiClient.delete(`/manual-payments/accounts/${accountId}`);
};
