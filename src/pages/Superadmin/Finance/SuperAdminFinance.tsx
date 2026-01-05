import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuperAdminRevenueReport, settleSuperAdminReport, RevenueReport } from '../../../services/api/finance';
import PageMeta from '../../../components/common/PageMeta';
import PageBreadcrumb from '../../../components/common/PageBreadCrumb';
import { Tabs, Tag, Table, Button, message, Popconfirm, Card, Statistic } from 'antd';
import { CheckCircleOutlined, SyncOutlined, DollarOutlined, TransactionOutlined } from '@ant-design/icons';
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
        <>
            <PageMeta title="HikeHub | Finance Management" description="Superadmin Finance Dashboard" />
            <PageBreadcrumb pageTitle="Finance Management" />
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6 shadow-theme-xs">
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Finance Dashboard
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Manage commissions (collections) and organizer payouts.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card bordered={false} className="shadow-sm rounded-xl bg-gray-50 dark:bg-white/[0.05]">
                        <Statistic title="Total Volume" value={filteredReports.length} />
                    </Card>
                    <Card bordered={false} className="shadow-sm rounded-xl bg-gray-50 dark:bg-white/[0.05]">
                        <Statistic
                            title={`Total ${activeTab === 'collections' ? 'Commissions' : 'Payouts'}`}
                            value={totalAmount}
                            precision={2}
                            suffix="ETB"
                            valueStyle={{ color: activeTab === 'collections' ? '#3f8600' : '#cf1322' }}
                        />
                    </Card>
                    <Card bordered={false} className="shadow-sm rounded-xl bg-gray-50 dark:bg-white/[0.05]">
                        <Statistic
                            title="Pending Settlement"
                            value={pendingAmount}
                            precision={2}
                            suffix="ETB"
                        />
                    </Card>
                </div>

                <Tabs
                    activeKey={activeTab}
                    onChange={(key) => setActiveTab(key as any)}
                    items={[
                        {
                            key: 'collections',
                            label: 'Collections (Commissions)',
                            children: (
                                <>
                                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-800/30">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full text-green-600 dark:text-green-200">
                                                <DollarOutlined />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                                                    Manual/Bank Payments
                                                </h4>
                                                <p className="text-sm text-green-700 dark:text-green-300">
                                                    Organizers hold these funds. They owe you the commission.
                                                    Mark as <strong>Settled</strong> when you receive payment from them.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <Table
                                        dataSource={filteredReports}
                                        columns={columns}
                                        loading={isLoading}
                                        rowKey="_id"
                                        scroll={{ x: true }}
                                        pagination={{ pageSize: 10 }}
                                    />
                                </>
                            )
                        },
                        {
                            key: 'payouts',
                            label: 'Payouts (Due to Organizers)',
                            children: (
                                <>
                                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-800/30">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full text-red-600 dark:text-red-200">
                                                <TransactionOutlined />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                                                    Online (Chapa) Payments
                                                </h4>
                                                <p className="text-sm text-red-700 dark:text-red-300">
                                                    You hold these funds. You owe the net amount to Organizers.
                                                    Transfer funds to them. <strong>They</strong> will mark it as Settled upon receipt.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <Table
                                        dataSource={filteredReports}
                                        columns={columns}
                                        loading={isLoading}
                                        rowKey="_id"
                                        scroll={{ x: true }}
                                        pagination={{ pageSize: 10 }}
                                    />
                                </>
                            )
                        }
                    ]}
                />
            </div>
        </>
    );
}
