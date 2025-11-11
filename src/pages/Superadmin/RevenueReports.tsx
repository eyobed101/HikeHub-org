import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { getUserRole } from "../../utils/userRole";
import axiosInstance from "../../utils/axiosInstance";
import { Spin, Select, DatePicker, Table, Space, message, Pagination } from "antd";
import { CalendarOutlined, DollarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import "../../index.css";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface RevenueReport {
  _id: string;
  transactionAmount: number;
  commissionAmount: number;
  organizerAmount: number;
  commissionRate: number;
  transactionDate: string;
  paymentCode: string;
  orderCode: string;
  createdAt: string;
  event: {
    _id: string;
    title: string;
    location: string;
    startDate: string;
    endDate: string;
  };
  organizer: {
    _id: string;
    username: string;
    email: string;
  };
  user: {
    _id: string;
    username: string;
    email: string;
    firstname?: string;
    lastname?: string;
  };
  organizerDetails: {
    _id: string;
    companyName?: string;
    commissionRate: number;
  };
}

interface RevenueSummary {
  totalTransactions: number;
  totalRevenue: number;
  totalCommission: number;
  totalOrganizerAmount: number;
  averageCommissionRate: number;
  averageTransactionAmount: number;
}

interface OrganizerBreakdown {
  organizerId: string;
  organizerName: string;
  organizerEmail: string;
  transactionCount: number;
  totalRevenue: number;
  totalCommission: number;
  totalOrganizerAmount: number;
  averageCommissionRate: number;
}

interface MonthlyBreakdown {
  year: number;
  month: number;
  transactionCount: number;
  totalRevenue: number;
  totalCommission: number;
  totalOrganizerAmount: number;
}

interface RevenueReportData {
  reports: RevenueReport[];
  summary: RevenueSummary;
  organizerBreakdown: OrganizerBreakdown[];
  monthlyBreakdown: MonthlyBreakdown[];
}

interface RevenueReportResponse {
  data: RevenueReportData;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export default function RevenueReports() {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<RevenueReportData | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 30,
  });
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [organizerFilter, setOrganizerFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [sortBy, setSortBy] = useState<string>("transactionDate");
  const [sortOrder, setSortOrder] = useState<string>("desc");

  useEffect(() => {
    const role = getUserRole();
    if (role !== 'Superadmin') {
      navigate('/superadmin');
      return;
    }
    fetchRevenueReport();
  }, [navigate, yearFilter, dateRange, organizerFilter, currentPage, pageSize, sortBy, sortOrder]);

  const fetchRevenueReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
      });
      
      if (dateRange[0] && dateRange[1]) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
      } else {
        const yearStart = `${yearFilter}-01-01`;
        const yearEnd = `${yearFilter}-12-31`;
        params.append('startDate', yearStart);
        params.append('endDate', yearEnd);
      }

      if (organizerFilter) {
        params.append('organizerId', organizerFilter);
      }

      const response = await axiosInstance.get(`superadmin/revenue-reports?${params.toString()}`);
      if (response.data.status === 1) {
        setReportData(response.data.data);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        message.error(response.data.message || "Failed to fetch revenue report");
      }
    } catch (error: any) {
      console.error("Error fetching revenue report:", error);
      message.error(error.response?.data?.message || "Failed to fetch revenue report");
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return '$100,000+';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  // Prepare chart data
  const getMonthlyRevenueData = () => {
    if (!reportData?.monthlyBreakdown) return { categories: [], series: [] };
    
    const sorted = [...reportData.monthlyBreakdown].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    const categories = sorted.map(item => {
      const date = new Date(item.year, item.month - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    const revenueSeries = sorted.map(item => item.totalRevenue);
    const commissionSeries = sorted.map(item => item.totalCommission);
    const organizerSeries = sorted.map(item => item.totalOrganizerAmount);

    return { categories, revenueSeries, commissionSeries, organizerSeries };
  };

  const getOrganizerBreakdownData = () => {
    if (!reportData?.organizerBreakdown) return { labels: [], series: [] };
    
    const sorted = [...reportData.organizerBreakdown].sort((a, b) => b.totalCommission - a.totalCommission);
    const labels = sorted.map(item => item.organizerName || 'Unknown');
    const series = sorted.map(item => item.totalCommission);

    return { labels, series };
  };

  const monthlyData = getMonthlyRevenueData();
  const organizerData = getOrganizerBreakdownData();

  // Chart options
  const monthlyRevenueOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: { show: false },
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    xaxis: {
      categories: monthlyData.categories,
      labels: {
        rotate: -45,
        style: {
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `$${val.toFixed(0)}`,
      },
    },
    colors: ['#10b981', '#3b82f6', '#f59e0b'],
    legend: {
      position: 'top',
    },
    tooltip: {
      y: {
        formatter: (val: number) => `$${val.toFixed(2)}`,
      },
    },
    series: [
      { name: 'Total Revenue', data: monthlyData.revenueSeries },
      { name: 'Platform Income', data: monthlyData.commissionSeries },
      { name: 'Organizer Amount', data: monthlyData.organizerSeries },
    ],
    grid: {
      borderColor: '#e5e7eb',
    },
  };

  const organizerBreakdownOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false },
    },
    xaxis: {
      categories: organizerData.labels,
      labels: {
        rotate: -45,
        style: {
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `$${val.toFixed(0)}`,
      },
    },
    colors: ['#3b82f6'],
    tooltip: {
      y: {
        formatter: (val: number) => `$${val.toFixed(2)}`,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
      },
    },
  };

  // Table columns
  const columns = [
    {
      title: 'Date',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      width: 100,
      fixed: 'left' as const,
      render: (date: string) => (
        <span className="text-gray-800 dark:text-gray-200 text-xs whitespace-nowrap">{formatDate(date)}</span>
      ),
      sorter: true,
    },
    {
      title: 'Event',
      key: 'event',
      width: 180,
      render: (record: RevenueReport) => (
        <div className="min-w-0">
          <div className="font-semibold text-gray-800 dark:text-gray-200 text-xs truncate" title={record.event?.title || 'N/A'}>
            {record.event?.title || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'Organizer',
      key: 'organizer',
      width: 140,
      render: (record: RevenueReport) => (
        <div className="min-w-0">
          <div className="text-gray-800 dark:text-gray-200 text-xs truncate" title={record.organizer?.username || 'N/A'}>
            {record.organizer?.username || 'N/A'}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate" title={record.organizer?.email || 'N/A'}>
            {record.organizer?.email || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'User',
      key: 'user',
      width: 140,
      render: (record: RevenueReport) => (
        <div className="min-w-0">
          <div className="text-gray-800 dark:text-gray-200 text-xs truncate" title={record.user?.username || 'N/A'}>
            {record.user?.username || 'N/A'}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate" title={record.user?.email || 'N/A'}>
            {record.user?.email || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'transactionAmount',
      key: 'transactionAmount',
      width: 110,
      render: (amount: number) => (
        <span className="text-gray-800 dark:text-gray-200 font-semibold text-xs whitespace-nowrap">{formatCurrency(amount)}</span>
      ),
      sorter: true,
    },
    {
      title: 'Rate',
      dataIndex: 'commissionRate',
      key: 'commissionRate',
      width: 70,
      render: (rate: number) => (
        <span className="text-gray-800 dark:text-gray-200 text-xs whitespace-nowrap">{rate.toFixed(2)}%</span>
      ),
    },
    {
      title: 'Platform',
      dataIndex: 'commissionAmount',
      key: 'commissionAmount',
      width: 110,
      render: (amount: number) => (
        <span className="text-green-600 dark:text-green-400 font-semibold text-xs whitespace-nowrap">{formatCurrency(amount)}</span>
      ),
      sorter: true,
    },
    {
      title: 'Organizer',
      dataIndex: 'organizerAmount',
      key: 'organizerAmount',
      width: 110,
      render: (amount: number) => (
        <span className="text-blue-600 dark:text-blue-400 font-semibold text-xs whitespace-nowrap">{formatCurrency(amount)}</span>
      ),
      sorter: true,
    },
    {
      title: 'Code',
      dataIndex: 'paymentCode',
      key: 'paymentCode',
      width: 100,
      render: (code: string) => (
        <span className="text-gray-800 dark:text-gray-200 text-xs font-mono truncate block" title={code || 'N/A'}>{code || 'N/A'}</span>
      ),
    },
  ];


  if (loading && !reportData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Revenue Reports - Superadmin" />
      <PageBreadcrumb pageName="Revenue Reports" />

      <div className="space-y-6 overflow-x-hidden">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <ComponentCard>
            <div className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mt-2 truncate">
                    {formatCurrency(reportData?.summary?.totalRevenue || 0)}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0 ml-2">
                  <DollarOutlined className="text-xl sm:text-2xl text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard>
            <div className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Platform Income</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mt-2 truncate">
                    {formatCurrency(reportData?.summary?.totalCommission || 0)}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0 ml-2">
                  <DollarOutlined className="text-xl sm:text-2xl text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard>
            <div className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Transactions</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mt-2 truncate">
                    {reportData?.summary?.totalTransactions || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Avg: {formatCurrency(reportData?.summary?.averageTransactionAmount || 0)}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0 ml-2">
                  <CalendarOutlined className="text-xl sm:text-2xl text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <ComponentCard>
            <div className="p-3 md:p-4">
              <h3 className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Monthly Revenue Breakdown
              </h3>
              <Chart
                options={monthlyRevenueOptions}
                series={monthlyRevenueOptions.series}
                type="line"
                height={300}
              />
            </div>
          </ComponentCard>

          <ComponentCard>
            <div className="p-3 md:p-4">
              <h3 className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Top Organizers by Commission
              </h3>
              <Chart
                options={organizerBreakdownOptions}
                series={[{ name: 'Platform Income', data: organizerData.series }]}
                type="bar"
                height={300}
              />
            </div>
          </ComponentCard>
        </div>

        {/* Filters and Table */}
        <ComponentCard>
          <div className="p-3 md:p-4 overflow-x-hidden">
            {/* Filters */}
            <div className="mb-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Year
                  </label>
                  <Select
                    value={yearFilter}
                    onChange={(value) => {
                      setYearFilter(value);
                      setDateRange([null, null]);
                      setCurrentPage(1);
                    }}
                    className="w-full"
                    size="large"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <Option key={year} value={year}>{year}</Option>
                    ))}
                  </Select>
                </div>
                <div className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date Range
                  </label>
                  <RangePicker
                    className="w-full"
                    value={dateRange}
                    onChange={(dates) => {
                      if (dates) {
                        setDateRange([dates[0], dates[1]]);
                      } else {
                        setDateRange([null, null]);
                      }
                      setCurrentPage(1);
                    }}
                    format="YYYY-MM-DD"
                    size="large"
                  />
                </div>
                <div className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <Select
                    value={sortBy}
                    onChange={(value) => {
                      setSortBy(value);
                      setCurrentPage(1);
                    }}
                    className="w-full"
                    size="large"
                  >
                    <Option value="transactionDate">Transaction Date</Option>
                    <Option value="transactionAmount">Transaction Amount</Option>
                    <Option value="commissionAmount">Platform Income</Option>
                    <Option value="organizerAmount">Organizer Amount</Option>
                    <Option value="createdAt">Created Date</Option>
                  </Select>
                </div>
                <div className="min-w-0">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Order
                  </label>
                  <Select
                    value={sortOrder}
                    onChange={(value) => {
                      setSortOrder(value);
                      setCurrentPage(1);
                    }}
                    className="w-full"
                    size="large"
                  >
                    <Option value="desc">Descending</Option>
                    <Option value="asc">Ascending</Option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Spin spinning={loading}>
                <Table
                  columns={columns}
                  dataSource={reportData?.reports || []}
                  rowKey="_id"
                  pagination={false}
                  scroll={{ x: 960 }}
                  size="middle"
                  className="[&_.ant-table-wrapper]:bg-transparent [&_.ant-table]:bg-white [&_.ant-table]:dark:bg-gray-900 [&_.ant-table-container]:bg-white [&_.ant-table-container]:dark:bg-gray-900 [&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:dark:bg-gray-800 [&_.ant-table-thead>tr>th]:px-2 [&_.ant-table-thead>tr>th]:py-2 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-xs [&_.ant-table-thead>tr>th]:text-gray-700 [&_.ant-table-thead>tr>th]:dark:text-gray-300 [&_.ant-table-tbody>tr>td]:px-2 [&_.ant-table-tbody>tr>td]:py-2 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr]:bg-white [&_.ant-table-tbody>tr]:dark:bg-gray-900 [&_.ant-table-tbody>tr:hover]:bg-gray-50 [&_.ant-table-tbody>tr:hover]:dark:bg-gray-800/50 [&_.ant-table-container]:border-gray-200 [&_.ant-table-container]:dark:border-gray-700"
                />
              </Spin>

              {/* Pagination */}
              {reportData && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                    Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                    {pagination.totalItems} transactions
                  </div>
                  <Pagination
                    current={pagination.currentPage}
                    total={pagination.totalItems}
                    pageSize={pagination.itemsPerPage}
                    showSizeChanger={true}
                    showQuickJumper={true}
                    showTotal={(total, range) => `${range[0]}-${range[1]} of ${total}`}
                    pageSizeOptions={['10', '20', '30', '50', '100']}
                    onChange={(page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    }}
                    onShowSizeChange={(current, size) => {
                      setCurrentPage(1);
                      setPageSize(size);
                    }}
                    className="[&_.ant-pagination-item]:bg-white [&_.ant-pagination-item]:dark:bg-gray-800 [&_.ant-pagination-item]:border-gray-300 [&_.ant-pagination-item]:dark:border-gray-600 [&_.ant-pagination-item]:text-gray-700 [&_.ant-pagination-item]:dark:text-gray-300 [&_.ant-pagination-item-active]:border-brand-500 [&_.ant-pagination-item-active]:dark:border-brand-500 [&_.ant-pagination-item-active>a]:text-brand-500 [&_.ant-pagination-item-active>a]:dark:text-brand-400 [&_.ant-pagination-prev]:text-gray-700 [&_.ant-pagination-prev]:dark:text-gray-300 [&_.ant-pagination-next]:text-gray-700 [&_.ant-pagination-next]:dark:text-gray-300 [&_.ant-select-selector]:bg-white [&_.ant-select-selector]:dark:bg-gray-800 [&_.ant-select-selector]:border-gray-300 [&_.ant-select-selector]:dark:border-gray-600 [&_.ant-input]:bg-white [&_.ant-input]:dark:bg-gray-800 [&_.ant-input]:border-gray-300 [&_.ant-input]:dark:border-gray-600"
                  />
                </div>
              )}
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}

