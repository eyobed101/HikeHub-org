import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { getUserRole } from "../../utils/userRole";
import axiosInstance from "../../utils/axiosInstance";
import { Spin, Select, DatePicker, Space, message, Pagination } from "antd";
import { CalendarOutlined, DollarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import "../../index.css";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface PaymentStatistics {
  totalRevenue: number;
  verifiedCount: number;
  totalPayments: number;
}

interface Payment {
  _id: string;
  amount: number;
  status: string;
  createdAt: string;
  user: {
    username: string;
    email: string;
  };
  event: {
    title: string;
  };
  bankTemplate?: {
    bankName: string;
  };
}

interface PaymentAnalytics {
  data: Payment[];  // Backend returns 'data' not 'payments'
  statistics: PaymentStatistics;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export default function PaymentAnalytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  useEffect(() => {
    const role = getUserRole();
    if (role !== 'Superadmin') {
      navigate('/superadmin');
      return;
    }
    fetchAnalytics();
  }, [navigate, yearFilter, dateRange, statusFilter, currentPage, pageSize]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      });
      
      if (dateRange[0] && dateRange[1]) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
      } else {
        // Use year filter for date range
        const yearStart = `${yearFilter}-01-01`;
        const yearEnd = `${yearFilter}-12-31`;
        params.append('startDate', yearStart);
        params.append('endDate', yearEnd);
      }

      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await axiosInstance.get(`superadmin/payments?${params.toString()}`);
      if (response.data.status === 1) {
        setAnalytics(response.data);
      } else {
        message.error(response.data.message || "Failed to fetch payment analytics");
      }
    } catch (error: any) {
      console.error("Error fetching payment analytics:", error);
      message.error(error.response?.data?.message || "Failed to fetch payment analytics");
    } finally {
      setLoading(false);
    }
  };

  const [platformIncome, setPlatformIncome] = useState(0);
  const [platformIncomeLoading, setPlatformIncomeLoading] = useState(false);

  useEffect(() => {
    const fetchPlatformIncome = async () => {
      try {
        setPlatformIncomeLoading(true);
        // Fetch actual commission data from Report table
        const params = new URLSearchParams();
        params.append('page', '1');
        params.append('limit', '1'); // We only need the summary, not the data
        
        if (dateRange[0] && dateRange[1]) {
          params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
          params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
        } else {
          const yearStart = `${yearFilter}-01-01`;
          const yearEnd = `${yearFilter}-12-31`;
          params.append('startDate', yearStart);
          params.append('endDate', yearEnd);
        }
        
        const reportResponse = await axiosInstance.get(`superadmin/platform-income?${params.toString()}`);
        if (reportResponse.data.status === 1 && reportResponse.data.data?.summary) {
          setPlatformIncome(reportResponse.data.data.summary.totalPlatformIncome || 0);
        } else {
          setPlatformIncome(0);
        }
      } catch (error: any) {
        console.error("Error fetching platform income:", error);
        // Fallback: Calculate based on estimated commission rate if endpoint fails
        if (analytics?.data) {
          const verifiedPayments = analytics.data.filter(p => p.status === 'verified');
          const totalAmount = verifiedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
          // Assuming average commission rate of 5% (fallback only)
          setPlatformIncome(totalAmount * 0.05);
        } else {
          setPlatformIncome(0);
        }
      } finally {
        setPlatformIncomeLoading(false);
      }
    };

    fetchPlatformIncome();
  }, [analytics, dateRange, yearFilter]);

  // Prepare chart data
  const getPaymentStatusData = () => {
    if (!analytics?.data) return { labels: [], series: [], colors: [] };
    
    const statusCounts: Record<string, number> = {};
    analytics.data.forEach(payment => {
      statusCounts[payment.status] = (statusCounts[payment.status] || 0) + 1;
    });

    const labels = Object.keys(statusCounts);
    const series = Object.values(statusCounts);
    
    const colors = labels.map(status => {
      switch (status) {
        case 'verified': return '#10b981'; // green
        case 'pending': return '#f59e0b'; // orange
        case 'failed': return '#ef4444'; // red
        case 'expired': return '#6b7280'; // gray
        default: return '#6b7280';
      }
    });

    return { labels, series, colors };
  };

  const getRevenueTrendData = () => {
    if (!analytics?.data) return { categories: [], series: [] };
    
    const verifiedPayments = analytics.data.filter(p => p.status === 'verified');
    const monthlyRevenue: Record<string, number> = {};
    
    verifiedPayments.forEach(payment => {
      const date = new Date(payment.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + (payment.amount || 0);
    });

    const categories = Object.keys(monthlyRevenue).sort();
    const series = categories.map(key => monthlyRevenue[key]);

    return { categories, series };
  };

  const getPaymentAmountDistribution = () => {
    if (!analytics?.data) return { categories: [], series: [] };
    
    const verifiedPayments = analytics.data.filter(p => p.status === 'verified');
    const ranges = [
      { label: 'ETB 0-50', min: 0, max: 50 },
      { label: 'ETB 51-100', min: 51, max: 100 },
      { label: 'ETB 101-200', min: 101, max: 200 },
      { label: 'ETB 201-500', min: 201, max: 500 },
      { label: 'ETB 500+', min: 501, max: Infinity },
    ];

    const counts = ranges.map(range => 
      verifiedPayments.filter(p => p.amount >= range.min && p.amount <= range.max).length
    );

    return {
      categories: ranges.map(r => r.label),
      series: counts,
    };
  };

  const statusData = getPaymentStatusData();
  const revenueTrend = getRevenueTrendData();
  const amountDistribution = getPaymentAmountDistribution();

  // Chart options
  const statusChartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 350,
    },
    labels: statusData.labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
    colors: statusData.colors,
    legend: {
      position: 'bottom',
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} payments`,
      },
    },
  };

  const revenueTrendOptions: ApexOptions = {
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
      categories: revenueTrend.categories,
      labels: {
        rotate: -45,
        style: {
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `ETB ${val.toFixed(0)}`,
      },
    },
    colors: ['#10b981'],
    tooltip: {
      y: {
        formatter: (val: number) => `ETB ${val.toFixed(2)}`,
      },
    },
    grid: {
      borderColor: '#e5e7eb',
    },
  };

  const amountDistributionOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false },
    },
    xaxis: {
      categories: amountDistribution.categories,
      labels: {
        style: {
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `${val}`,
      },
    },
    colors: ['#3b82f6'],
    tooltip: {
      y: {
        formatter: (val: number) => `${val} payments`,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
      },
    },
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 100000) return 'ETB 100,000+';
    return `ETB ${new Intl.NumberFormat('en-ET', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
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

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 dark:text-green-400';
      case 'pending': return 'text-orange-600 dark:text-orange-400';
      case 'failed': return 'text-red-600 dark:text-red-400';
      case 'expired': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Payment Analytics - Superadmin" />
      <PageBreadcrumb pageName="Payment Analytics" />

      <div className="space-y-6">
        {/* Filters */}
        <ComponentCard>
          <div className="p-4 md:p-6 overflow-x-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  Status
                </label>
                <Select
                  value={statusFilter || undefined}
                  onChange={(value) => {
                    setStatusFilter(value || "");
                    setCurrentPage(1);
                  }}
                  className="w-full"
                  size="large"
                  allowClear
                  placeholder="All Statuses"
                >
                  <Option value="verified">Verified</Option>
                  <Option value="pending">Pending</Option>
                  <Option value="failed">Failed</Option>
                  <Option value="expired">Expired</Option>
                </Select>
              </div>
              <div className="flex items-end min-w-0">
                <button
                  onClick={() => {
                    setYearFilter(new Date().getFullYear());
                    setDateRange([null, null]);
                    setStatusFilter("");
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <ComponentCard>
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mt-2 truncate">
                    {analytics?.statistics?.totalRevenue ? formatCurrency(analytics.statistics.totalRevenue) : 'ETB 0.00'}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0 ml-2">
                  <DollarOutlined className="text-xl sm:text-2xl text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard>
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Platform Income</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mt-2 truncate">
                    {platformIncomeLoading ? (
                      <Spin size="small" />
                    ) : (
                      formatCurrency(platformIncome)
                    )}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1">(From verified transactions)</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0 ml-2">
                  <DollarOutlined className="text-xl sm:text-2xl text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard>
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Verified Payments</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mt-2">
                    {analytics?.statistics?.verifiedCount || 0}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0 ml-2">
                  <DollarOutlined className="text-xl sm:text-2xl text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard>
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Payments</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mt-2">
                    {analytics?.statistics?.totalPayments || 0}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0 ml-2">
                  <DollarOutlined className="text-xl sm:text-2xl text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ComponentCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Payment Status Distribution
              </h3>
              {statusData.series.length > 0 ? (
                <Chart
                  options={statusChartOptions}
                  series={statusData.series}
                  type="donut"
                  height={350}
                />
              ) : (
                <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
                  No data available
                </div>
              )}
            </div>
          </ComponentCard>

          <ComponentCard>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Revenue Trend Over Time
              </h3>
              {revenueTrend.series.length > 0 ? (
                <Chart
                  options={revenueTrendOptions}
                  series={[{ name: 'Revenue', data: revenueTrend.series }]}
                  type="line"
                  height={350}
                />
              ) : (
                <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
                  No data available
                </div>
              )}
            </div>
          </ComponentCard>
        </div>

        <ComponentCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Payment Amount Distribution
            </h3>
            {amountDistribution.series.some(v => v > 0) ? (
              <Chart
                options={amountDistributionOptions}
                series={[{ name: 'Payments', data: amountDistribution.series }]}
                type="bar"
                height={350}
              />
            ) : (
              <div className="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
                No data available
              </div>
            )}
          </div>
        </ComponentCard>

        {/* Recent Payments Table */}
        <ComponentCard>
          <div className="p-4 md:p-6 overflow-x-hidden">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Recent Payments
            </h3>
            <Spin spinning={loading}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-2 md:px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs">User</th>
                      <th className="text-left py-3 px-2 md:px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs">Event</th>
                      <th className="text-left py-3 px-2 md:px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs">Amount</th>
                      <th className="text-left py-3 px-2 md:px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs">Status</th>
                      <th className="text-left py-3 px-2 md:px-4 font-semibold text-gray-700 dark:text-gray-300 text-xs">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics?.data && analytics.data.length > 0 ? (
                      analytics.data.map((payment) => (
                        <tr
                          key={payment._id}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="py-3 px-2 md:px-4 text-gray-800 dark:text-gray-200">
                            <div className="min-w-0">
                              <div className="font-medium text-xs truncate" title={payment.user?.username || 'N/A'}>
                                {payment.user?.username || 'N/A'}
                              </div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate" title={payment.user?.email || 'N/A'}>
                                {payment.user?.email || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 md:px-4 text-gray-800 dark:text-gray-200">
                            <div className="text-xs truncate max-w-[150px]" title={payment.event?.title || 'N/A'}>
                              {payment.event?.title || 'N/A'}
                            </div>
                          </td>
                          <td className="py-3 px-2 md:px-4 text-gray-800 dark:text-gray-200 font-semibold text-xs whitespace-nowrap">
                            {formatCurrency(payment.amount || 0)}
                          </td>
                          <td className="py-3 px-2 md:px-4">
                            <span className={`font-medium capitalize text-xs ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 md:px-4 text-gray-800 dark:text-gray-200 text-xs whitespace-nowrap">
                            {formatDate(payment.createdAt)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500 dark:text-gray-400">
                          No payments found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {analytics?.pagination && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                    Showing {((analytics.pagination.currentPage - 1) * analytics.pagination.itemsPerPage) + 1} to{' '}
                    {Math.min(analytics.pagination.currentPage * analytics.pagination.itemsPerPage, analytics.pagination.totalItems)} of{' '}
                    {analytics.pagination.totalItems} payments
                  </div>
                  <Pagination
                    current={analytics.pagination.currentPage}
                    total={analytics.pagination.totalItems}
                    pageSize={analytics.pagination.itemsPerPage}
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
            </Spin>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}

