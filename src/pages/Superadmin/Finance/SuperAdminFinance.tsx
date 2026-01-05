import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuperAdminRevenueReport, settleSuperAdminReport, RevenueReport } from '../../../services/api/finance';
import PageMeta from '../../../components/common/PageMeta';
import { Tabs, Tag, Table, Button, message, Popconfirm, Card, Statistic } from 'antd';
import { CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

export default function SuperAdminFinance() {
    // We filter client-side for now as backend returns all
    // Or we rely on Table filters if we fetch all
    const [activeTab, setActiveTab] = useState<'collections' | 'payouts'>('collections');
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['superAdminRevenue'],
        queryFn: () => getSuperAdminRevenueReport({ limit: 1000 }) // Fetch large set for overview
    });

    const settleMutation = useMutation({
        mutationFn: settleSuperAdminReport,
        onSuccess: () => {
            message.success('Commission settled successfully');
            queryClient.invalidateQueries({ queryKey: ['superAdminRevenue'] });
        },
        onError: (err: any) => {
            message.error(err.response?.data?.message || 'Failed to settle report');
        }
    });

    const allReports: RevenueReport[] = data?.data?.reports || [];

    // Filter reports based on tab
    const filteredReports = allReports.filter(r => {
        if (activeTab === 'collections') {
            // Manual/Bank: Organizer holds money, pays Commission (Collection)
            return r.paymentMethod !== 'chapa';
        } else {
            // Chapa: Admin holds money, pays Organizer (Payout)
            // But currently SA page focuses on what SA needs to ACT on?
            // Actually SA needs to track both.
            // Payouts tab = Chapa payments (SA owes EO)
            return r.paymentMethod === 'chapa';
        }
    });

    // Calculate totals for filtered view
    const totalAmount = filteredReports.reduce((sum, r) => sum + (activeTab === 'collections' ? r.commissionAmount : r.organizerAmount), 0);
    const pendingAmount = filteredReports.filter(r => r.settlementStatus === 'Unsettled').reduce((sum, r) => sum + (activeTab === 'collections' ? r.commissionAmount : r.organizerAmount), 0);

    const columns: ColumnsType<RevenueReport> = [
        {
            title: 'Transition Date',
            dataIndex: 'transactionDate',
            key: 'transactionDate',
            render: (date) => dayjs(date).format('DD MMM YYYY'),
            sorter: (a, b) => dayjs(a.transactionDate).valueOf() - dayjs(b.transactionDate).valueOf(),
        },
        {
            title: 'Organizer',
            dataIndex: ['organizer', 'username'],
            key: 'organizer',
        },
        {
            title: 'Event',
            dataIndex: ['event', 'title'],
            key: 'event',
        },
        {
            title: 'Total Amount',
            dataIndex: 'transactionAmount',
            key: 'amount',
            render: (val) => `${val} ETB`,
        },
        {
            title: activeTab === 'collections' ? 'Commission (Receivable)' : 'Payout (Payable)',
            key: 'share',
            render: (_, record) => (
                <span className="font-semibold" style={{ color: activeTab === 'collections' ? '#3f8600' : '#cf1322' }}>
                    {activeTab === 'collections' ? record.commissionAmount : record.organizerAmount} ETB
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
                // SA settles Collections (Manual)
                // SA DOES NOT settle Payouts (Chapa) - EO does that
                if (activeTab === 'collections' && record.settlementStatus === 'Unsettled') {
                    return (
                        <Popconfirm
                            title="Mark as Settled"
                            description="Has the organizer paid this commission?"
                            onConfirm={() => settleMutation.mutate(record._id)}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button type="primary" size="small">
                                Mark Settled
                            </Button>
                        </Popconfirm>
                    );
                }
                return null;
            }
        }
    ];

    return (
        <div className="p-6">
            <PageMeta title="Finance Management | SuperAdmin" />
            <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Finance Management</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                    <Statistic title="Total Volume" value={filteredReports.length} />
                </Card>
                <Card>
                    <Statistic
                        title={`Total ${activeTab === 'collections' ? 'Commissions' : 'Payouts'}`}
                        value={totalAmount}
                        precision={2}
                        suffix="ETB"
                        valueStyle={{ color: activeTab === 'collections' ? '#3f8600' : '#cf1322' }}
                    />
                </Card>
                <Card>
                    <Statistic
                        title="Pending Settlement"
                        value={pendingAmount}
                        precision={2}
                        suffix="ETB"
                    />
                </Card>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as any)}
                    items={[
                        {
                            key: 'collections',
                            label: 'Collections (Commissions)',
                            children: (
                                <>
                                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                                        <p className="text-green-800 dark:text-green-200">
                                            <strong>Manual/Bank Payments</strong>: Organizers hold these funds. They owe you the commission.
                                            Mark as <strong>Settled</strong> when you receive payment from them.
                                        </p>
                                    </div>
                                    <Table
                                        dataSource={filteredReports}
                                        columns={columns}
                                        loading={isLoading}
                                        rowKey="_id"
                                    />
                                </>
                            )
                        },
                        {
                            key: 'payouts',
                            label: 'Payouts (Due to Organizers)',
                            children: (
                                <>
                                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                                        <p className="text-red-800 dark:text-red-200">
                                            <strong>Online (Chapa) Payments</strong>: You hold these funds. You owe the net amount to Organizers.
                                            Transfer funds to them. <strong>They</strong> will mark it as Settled upon receipt.
                                        </p>
                                    </div>
                                    <Table
                                        dataSource={filteredReports}
                                        columns={columns}
                                        loading={isLoading}
                                        rowKey="_id"
                                    />
                                </>
                            )
                        }
                    ]}
                />
            </div>
        </div>
    );
}
