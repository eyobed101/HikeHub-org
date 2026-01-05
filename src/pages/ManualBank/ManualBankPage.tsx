import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getManualBanks,
    getOrganizerManualAccounts,
    addManualBankAccount,
    deleteManualBankAccount,
    type ManualBank,
    type ManualBankAccount
} from "../../services/api/manualBank";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import { PlusOutlined, DeleteOutlined, BankOutlined, LoadingOutlined } from "@ant-design/icons";
import { message } from "antd";

export default function ManualBankPage() {
    const queryClient = useQueryClient();
    const { isOpen, openModal, closeModal } = useModal();
    const [selectedBankId, setSelectedBankId] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountHolderName, setAccountHolderName] = useState("");

    // Fetch Banks
    const { data: banks = [] } = useQuery({
        queryKey: ["manualBanks"],
        queryFn: getManualBanks,
    });

    // Fetch Accounts
    const { data: accounts = [], isLoading } = useQuery({
        queryKey: ["manualAccounts"],
        queryFn: getOrganizerManualAccounts,
    });

    // Add Mutation
    const addMutation = useMutation({
        mutationFn: addManualBankAccount,
        onSuccess: () => {
            message.success("Bank account added successfully");
            queryClient.invalidateQueries({ queryKey: ["manualAccounts"] });
            closeModal();
            resetForm();
        },
        onError: (err: any) => {
            message.error(err.response?.data?.message || "Failed to add bank account");
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: deleteManualBankAccount,
        onSuccess: () => {
            message.success("Bank account removed successfully");
            queryClient.invalidateQueries({ queryKey: ["manualAccounts"] });
        },
        onError: (err: any) => {
            message.error(err.response?.data?.message || "Failed to remove bank account");
        }
    });

    const handleSubmit = () => {
        if (!selectedBankId || !accountNumber || !accountHolderName) {
            message.error("Please fill all fields");
            return;
        }
        addMutation.mutate({
            bankId: selectedBankId,
            accountNumber,
            accountHolderName
        });
    };

    const resetForm = () => {
        setSelectedBankId("");
        setAccountNumber("");
        setAccountHolderName("");
    };

    return (
        <>
            <PageMeta title="Manual Bank Accounts | HikeHub" description="Manage your manual transfer bank accounts" />
            <PageBreadcrumb pageTitle="Manual Bank Accounts" />

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 shadow-theme-xs">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Bank Accounts
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Add bank accounts where users can manually transfer payments.
                        </p>
                    </div>
                    <button
                        onClick={openModal}
                        className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
                    >
                        <PlusOutlined /> Add Account
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-10">
                        <LoadingOutlined className="text-2xl text-brand-500" />
                    </div>
                ) : accounts.length === 0 ? (
                    <div className="text-center py-12 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-dashed border-gray-300 dark:border-gray-700">
                        <BankOutlined className="text-4xl text-gray-300 dark:text-gray-600 mb-3" />
                        <h3 className="text-sm font-medium text-gray-800 dark:text-white/90">No accounts added</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Add a bank account to start accepting manual payments.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {accounts.map((account) => (
                            <div
                                key={account._id}
                                className="relative group rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/[0.02] p-5 hover:border-brand-300 dark:hover:border-brand-700 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                                            {account.bank.logo ? (
                                                <img src={account.bank.logo} alt={account.bank.bankName} className="w-6 h-6 object-contain" />
                                            ) : (
                                                <BankOutlined className="text-gray-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">
                                                {account.bank.bankName}
                                            </h4>
                                            <p className="text-xs text-brand-500 font-medium bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-full inline-block mt-1">
                                                {account.bank.type}
                                            </p>
                                        </div>
                                    </div>
                                    {/* <Popconfirm
                                        title="Remove Account"
                                        description="Are you sure you want to remove this account?"
                                        onConfirm={() => deleteMutation.mutate(account._id)}
                                        okText="Yes"
                                        cancelText="No"
                                        okButtonProps={{ danger: true }}
                                    > */}
                                    <button
                                        onClick={() => deleteMutation.mutate(account._id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all rounded-lg hover:bg-gray-200 dark:hover:bg-white/10"
                                        title="Remove Account"
                                    >
                                        <DeleteOutlined />
                                    </button>
                                    {/* </Popconfirm> */}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Account Number</p>
                                        <p className="font-mono text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {account.accountNumber}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Account Holder</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                            {account.accountHolderName}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Modal */}
                <Modal
                    isOpen={isOpen}
                    onClose={() => {
                        closeModal();
                        resetForm();
                    }}
                    className="max-w-[500px] p-6"
                >
                    <div className="flex flex-col">
                        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-1">
                            Add Bank Account
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                            Enter your bank details for manual transfers
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Select Bank
                                </label>
                                <select
                                    value={selectedBankId}
                                    onChange={(e) => setSelectedBankId(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                                >
                                    <option value="" disabled className="dark:bg-gray-800">Select a bank</option>
                                    {banks.map((bank) => (
                                        <option key={bank._id} value={bank._id} className="dark:bg-gray-800">
                                            {bank.bankName} - {bank.type}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Account Number
                                </label>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    placeholder="Enter account number"
                                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Account Holder Name
                                </label>
                                <input
                                    type="text"
                                    value={accountHolderName}
                                    onChange={(e) => setAccountHolderName(e.target.value)}
                                    placeholder="Enter account holder name"
                                    className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-8 justify-end">
                            <button
                                onClick={() => {
                                    closeModal();
                                    resetForm();
                                }}
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-white/5"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={addMutation.isPending}
                                className="px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 flex items-center gap-2"
                            >
                                {addMutation.isPending && <LoadingOutlined />}
                                Save Account
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </>
    );
}
