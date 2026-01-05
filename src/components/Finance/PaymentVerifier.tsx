import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingManualPayments, verifyManualPayment, Payment } from '../../services/api/paymentVerifier';
import { Table, Button, message, Popconfirm, Image, Input, Modal, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { TextArea } = Input;

export default function PaymentVerifier() {
    const queryClient = useQueryClient();
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [searchText, setSearchText] = useState('');

    const { data: payments = [], isLoading } = useQuery({
        queryKey: ['pendingManualPayments'],
        queryFn: async () => {
            const res = await getPendingManualPayments();
            return res.data;
        }
    });

    const verifyMutation = useMutation({
        mutationFn: ({ id, action, reason }: { id: string, action: 'approve' | 'reject', reason?: string }) =>
            verifyManualPayment(id, action, reason),
        onSuccess: () => {
            message.success('Payment processed successfully');
            queryClient.invalidateQueries({ queryKey: ['pendingManualPayments'] });
            setRejectModalVisible(false);
            setRejectionReason('');
        },
        onError: (err: any) => {
            message.error(err.response?.data?.message || 'Failed to process payment');
        }
    });

    const handleReject = () => {
        if (!selectedPaymentId) return;
        if (!rejectionReason.trim()) {
            message.warning('Please provide a reason for rejection');
            return;
        }
        verifyMutation.mutate({ id: selectedPaymentId, action: 'reject', reason: rejectionReason });
    };

    const filteredPayments = payments.filter(p =>
        p.user?.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
        p.user?.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        p.paymentCode?.toLowerCase().includes(searchText.toLowerCase()) ||
        p.event?.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        p.orderCode?.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns: ColumnsType<Payment> = [
        {
            title: 'Date',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) => dayjs(date).format('DD MMM YYYY, HH:mm'),
            sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
            width: 150
        },
        {
            title: 'User',
            key: 'user',
            render: (_, record) => (
                <div className="flex flex-col">
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                        {record.user?.firstName} {record.user?.lastName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{record.user?.email}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{record.user?.phoneNumber}</span>
                </div>
            )
        },
        {
            title: 'Reference',
            key: 'reference',
            render: (_, record) => (
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-500">Code: <span className="text-gray-700 dark:text-gray-300">{record.paymentCode}</span></span>
                    <span className="text-xs font-semibold text-gray-500">Order: <span className="text-gray-700 dark:text-gray-300">{record.orderCode}</span></span>
                </div>
            )
        },
        {
            title: 'Event',
            dataIndex: ['event', 'title'],
            key: 'event',
            render: (title) => <span className="font-medium text-blue-600 dark:text-blue-400">{title}</span>
        },
        {
            title: 'Amount',
            key: 'amount',
            render: (_, record) => (
                <div className="flex flex-col">
                    <span className="font-bold text-green-600 dark:text-green-400">{record.amount} ETB</span>
                    <span className="text-xs text-gray-500">{record.quantity} Ticket(s)</span>
                </div>
            )
        },
        {
            title: 'Receipt',
            key: 'receipt',
            render: (_, record) => (
                record.receiptImage ? (
                    <Image
                        width={80}
                        src={record.receiptImage}
                        placeholder={
                            <Image
                                preview={false}
                                src={record.receiptImage} // Or a placeholder asset
                                width={80}
                            />
                        }
                    />
                ) : <span className="text-gray-400">No Image</span>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Popconfirm
                        title="Approve Payment"
                        description="Are you sure you want to verify this payment?"
                        onConfirm={() => verifyMutation.mutate({ id: record._id, action: 'approve' })}
                        okText="Verify"
                        cancelText="Cancel"
                        okButtonProps={{ type: 'primary', className: 'bg-green-600 hover:bg-green-700' }}
                    >
                        <Button type="primary" size="small" icon={<CheckCircleOutlined />} className="bg-green-600 hover:bg-green-700 border-green-600">
                            Verify
                        </Button>
                    </Popconfirm>
                    <Button
                        danger
                        size="small"
                        icon={<CloseCircleOutlined />}
                        onClick={() => {
                            setSelectedPaymentId(record._id);
                            setRejectModalVisible(true);
                        }}
                    >
                        Reject
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 shadow-theme-xs">
                <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            Pending Verifications
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Review and verify manual bank transfer receipts.
                        </p>
                    </div>
                    <Input
                        prefix={<SearchOutlined className="text-gray-400" />}
                        placeholder="Search user, code, or event..."
                        className="w-full md:w-64"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                    />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Security Note:</strong> Always verify the transaction reference code and amount with your actual bank statement before approving.
                    </p>
                </div>

                <Table
                    dataSource={filteredPayments}
                    columns={columns}
                    rowKey="_id"
                    loading={isLoading}
                    scroll={{ x: true }}
                    pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} items` }}
                />
            </div>

            <Modal
                title="Reject Payment"
                open={rejectModalVisible}
                onOk={handleReject}
                onCancel={() => {
                    setRejectModalVisible(false);
                    setRejectionReason('');
                }}
                okText="Confirm Reject"
                okButtonProps={{ danger: true, loading: verifyMutation.isPending }}
            >
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                    This action will mark the payment as failed and notify the user. Please provide a reason.
                </p>
                <TextArea
                    rows={3}
                    placeholder="E.g., Receipt image unclear, Transaction code not found..."
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                />
            </Modal>
        </div>
    );
}
