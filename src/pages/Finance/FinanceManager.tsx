import { useState } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import { Tabs } from 'antd';
import { DollarOutlined, SolutionOutlined, BankOutlined } from '@ant-design/icons';
import RevenueOverview from '../../components/Finance/RevenueOverview';
import PaymentVerifier from '../../components/Finance/PaymentVerifier';
import BankAccountsManager from '../../components/Finance/BankAccountsManager';

export default function FinanceManager() {
    const [activeKey, setActiveKey] = useState('overview');

    const items = [
        {
            key: 'overview',
            label: (
                <span className="flex items-center gap-2">
                    <DollarOutlined />
                    Overview
                </span>
            ),
            children: <RevenueOverview />
        },
        {
            key: 'verification',
            label: (
                <span className="flex items-center gap-2">
                    <SolutionOutlined />
                    Verify Payments
                </span>
            ),
            children: <PaymentVerifier />
        },
        {
            key: 'accounts',
            label: (
                <span className="flex items-center gap-2">
                    <BankOutlined />
                    Bank Accounts
                </span>
            ),
            children: <BankAccountsManager />
        }
    ];

    return (
        <div className="w-full max-w-full min-w-0 overflow-x-hidden">
            <PageMeta title="Finance & Payments | HikeHub" description="All-in-one financial dashboard" />
            <PageBreadcrumb pageTitle="Finance & Payments" />

            <div className="mb-6 w-full max-w-full min-w-0 overflow-x-hidden">
                <Tabs
                    activeKey={activeKey}
                    onChange={setActiveKey}
                    items={items}
                    type="card"
                    size="large"
                    className="finance-tabs"
                />
            </div>
        </div>
    );
}
