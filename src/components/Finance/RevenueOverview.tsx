import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrganizerRevenueReports, settleOrganizerReport, RevenueReport } from '../../services/api/finance';
import { Tabs, Tag, Table, Button, message, Popconfirm, Statistic, Card } from 'antd';
import { CheckCircleOutlined, SyncOutlined, DollarOutlined, TransactionOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

export default function RevenueOverview() {
    const [activeTab, setActiveTab] = useState<'receivable' | 'payable'>('receivable');
    const queryClient = useQueryClient();

    // Fetch Reports
    const { data, isLoading } = useQuery({
        queryKey: ['organizerRevenue', activeTab],
        queryFn: () => getOrganizerRevenueReports({
            type: activeTab,
            limit: 100 // Fetching more for now, implementation of proper pagination can be added
        })
    });

    // Settle Mutation
    const settleMutation = useMutation({
        mutationFn: settleOrganizerReport,
        onSuccess: () => {
            message.success('Payout confirmed successfully');
            queryClient.invalidateQueries({ queryKey: ['organizerRevenue'] });
        },
        onError: (err: any) => {
            message.error(err.response?.data?.message || 'Failed to confirm payout');
        }
    });

    const reports = data?.data?.reports || [];
    const summary = data?.data?.summary;

    const columns: ColumnsType<RevenueReport> = [
        {
            title: 'Transition Date',
            dataIndex: 'transactionDate',
            key: 'transactionDate',
            render: (date) => dayjs(date).format('DD MMM YYYY, HH:mm'),
            sorter: (a, b) => dayjs(a.transactionDate).valueOf() - dayjs(b.transactionDate).valueOf(),
        },
        {
            title: 'Event',
            dataIndex: ['event', 'title'],
            key: 'event',
        },
        {
            title: 'User',
            key: 'user',
            render: (_, record) => (
                <span>{record.user?.firstname} {record.user?.lastname} ({record.user?.username})</span>
            )
        },
        {
            title: 'Amount',
            dataIndex: 'transactionAmount',
            key: 'amount',
            render: (amount) => `${amount} ETB`,
        },
        {
            title: activeTab === 'receivable' ? 'Net Payout' : 'Commission Due',
            key: 'net',
            render: (_, record) => (
                <span className="font-semibold">
                    {activeTab === 'receivable' ? record.organizerAmount : record.commissionAmount} ETB
                </span>
            )
        },
        {
            title: 'Status',
            dataIndex: 'settlementStatus',
            key: 'status',
            render: (status) => (
                <Tag color={status === 'Settled' ? 'green' : 'orange'}>
                    {status === 'Settled' ? <CheckCircleOutlined /> : <SyncOutlined spin />} {status}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => {
                if (activeTab === 'receivable' && record.settlementStatus === 'Unsettled') {
                    return (
                        <Popconfirm
                            title="Confirm Receipt"
                            description="Have you received this payout from Admin? This action cannot be undone."
                            onConfirm={() => settleMutation.mutate(record._id)}
                            okText="Yes, I Received"
                            cancelText="No"
                        >
                            <Button type="primary" size="small" icon={<CheckCircleOutlined />}>
                                Confirm Receipt
                            </Button>
                        </Popconfirm>
                    );
                }
                return null;
            }
        }
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card bordered={false} className="shadow-sm rounded-xl dark:bg-gray-800">
                    <Statistic
                        title="Total Revenue"
                        value={summary?.totalRevenue || 0}
                        precision={2}
                        suffix="ETB"
                        prefix={<DollarOutlined />}
                        valueStyle={{ color: '#3f8600' }}
                    />
                </Card>
                <Card bordered={false} className="shadow-sm rounded-xl dark:bg-gray-800">
                    <Statistic
                        title="Total Transactions"
                        value={summary?.totalTransactions || 0}
                        prefix={<TransactionOutlined />}
                    />
                </Card>
                <Card bordered={false} className="shadow-sm rounded-xl dark:bg-gray-800">
                    <Statistic
                        title={activeTab === 'receivable' ? "Total Receivables" : "Total Commission Paid"}
                        value={activeTab === 'receivable' ? (summary?.totalOrganizerAmount || 0) : (summary?.totalCommission || 0)}
                        precision={2}
                        suffix="ETB"
                        valueStyle={{ color: activeTab === 'receivable' ? '#1890ff' : '#cf1322' }}
                    />
                </Card>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 shadow-theme-xs">
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as 'receivable' | 'payable')}
                    items={[
                        {
                            key: 'receivable',
                            label: 'Receivables (Payouts)',
                            children: (
                                <div>
                                    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                        <p className="text-sm text-blue-800 dark:text-blue-200">
                                            These are list of payments made via <strong>Chapa</strong> (Online).
                                            The Admin collects these funds and transfers your share (Revenue - Commission).
                                            <strong>Confirm Receipt</strong> when you receive the bank transfer from Admin.
                                        </p>
                                    </div>
                                    <Table
                                        dataSource={reports}
                                        columns={columns}
                                        rowKey="_id"
                                        loading={isLoading}
                                        scroll={{ x: true }}
                                        pagination={{ pageSize: 10 }}
                                    />
                                </div>
                            )
                        },
                        {
                            key: 'payable',
                            label: 'Payables (Commissions)',
                            children: (
                                <div>
                                    <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
                                        <p className="text-sm text-orange-800 dark:text-orange-200">
                                            These are list of payments made via <strong>Manual Bank Transfer</strong> directly to you.
                                            You owe the Service Commission to the Admin.
                                            The Admin will mark these as <strong>Settled</strong> once you transfer the commission.
                                        </p>
                                    </div>
                                    <Table
                                        dataSource={reports}
                                        columns={columns}
                                        rowKey="_id"
                                        loading={isLoading}
                                        scroll={{ x: true }}
                                        pagination={{ pageSize: 10 }}
                                    />
                                </div>
                            )
                        }
                    ]}
                />
            </div>
        </div>
    );
}
