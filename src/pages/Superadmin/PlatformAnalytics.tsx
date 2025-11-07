import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { getUserRole } from "../../utils/userRole";
import axiosInstance from "../../utils/axiosInstance";
import { Spin, Select, DatePicker, message } from "antd";
import { CalendarOutlined, UserOutlined, DollarOutlined, RiseOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import "../../index.css";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface GrowthData {
  _id: {
    year: number;
    month: number;
    role?: string;
  };
  count: number;
  totalRevenue?: number;
  revenue?: number;
}

interface TopOrganizer {
  organizerId: string;
  organizerName: string;
  totalRevenue: number;
  eventCount: number;
  paymentCount: number;
}

interface TopEvent {
  eventId: string;
  title: string;
  totalRevenue: number;
  participantCount: number;
}

interface CategoryDistribution {
  categoryId: string;
  categoryName: string;
  count: number;
}

interface PaymentStatusDistribution {
  _id: string;
  count: number;
  totalAmount: number;
}

interface PlatformAnalyticsData {
  userGrowth: GrowthData[];
  eventGrowth: GrowthData[];
  revenueGrowth: GrowthData[];
  topOrganizers: TopOrganizer[];
  topEvents: TopEvent[];
  categoryDistribution: CategoryDistribution[];
  paymentStatusDistribution: PaymentStatusDistribution[];
}

export default function PlatformAnalytics() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<PlatformAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  useEffect(() => {
    const role = getUserRole();
    if (role !== 'Superadmin') {
      navigate('/superadmin');
      return;
    }
    fetchAnalytics();
  }, [navigate, yearFilter, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (dateRange[0] && dateRange[1]) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
      } else {
        params.append('year', yearFilter.toString());
      }

      const response = await axiosInstance.get(`superadmin/analytics?${params.toString()}`);
      if (response.data.status === 1) {
        setAnalytics(response.data.data);
      } else {
        message.error(response.data.message || "Failed to fetch platform analytics");
      }
    } catch (error: any) {
      console.error("Error fetching platform analytics:", error);
      message.error(error.response?.data?.message || "Failed to fetch platform analytics");
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

  // Prepare chart data
  const getUserGrowthData = () => {
    if (!analytics?.userGrowth) return { categories: [], series: [] };
    
    // Group by month and sum all roles
    const monthlyData: Record<string, number> = {};
    analytics.userGrowth.forEach(item => {
      const monthKey = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + item.count;
    });

    const sortedKeys = Object.keys(monthlyData).sort();
    const categories = sortedKeys.map(key => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    const series = sortedKeys.map(key => monthlyData[key]);

    return { categories, series };
  };

  const getEventGrowthData = () => {
    if (!analytics?.eventGrowth) return { categories: [], series: [] };
    
    const categories = analytics.eventGrowth.map(item => {
      const date = new Date(item._id.year, item._id.month - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    const series = analytics.eventGrowth.map(item => item.count);

    return { categories, series };
  };

  const getRevenueGrowthData = () => {
    if (!analytics?.revenueGrowth) return { categories: [], series: [] };
    
    const categories = analytics.revenueGrowth.map(item => {
      const date = new Date(item._id.year, item._id.month - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });
    const series = analytics.revenueGrowth.map(item => item.revenue || 0);

    return { categories, series };
  };

  const getTopOrganizersData = () => {
    if (!analytics?.topOrganizers) return { labels: [], series: [] };
    
    const labels = analytics.topOrganizers.map(item => item.organizerName || 'Unknown');
    const series = analytics.topOrganizers.map(item => item.totalRevenue);

    return { labels, series };
  };

  const getTopEventsData = () => {
    if (!analytics?.topEvents) return { labels: [], series: [] };
    
    const labels = analytics.topEvents.map(item => item.title || 'Unknown');
    const series = analytics.topEvents.map(item => item.totalRevenue);

    return { labels, series };
  };

  const getCategoryDistributionData = () => {
    if (!analytics?.categoryDistribution) return { labels: [], series: [] };
    
    const labels = analytics.categoryDistribution.map(item => item.categoryName || 'Unknown');
    const series = analytics.categoryDistribution.map(item => item.count);

    return { labels, series };
  };

  const getPaymentStatusData = () => {
    if (!analytics?.paymentStatusDistribution) return { labels: [], series: [], colors: [] };
    
    const labels = analytics.paymentStatusDistribution.map(item => item._id || 'Unknown');
    const series = analytics.paymentStatusDistribution.map(item => item.count);
    
    const colors = labels.map(status => {
      switch (status.toLowerCase()) {
        case 'verified': return '#10b981'; // green
        case 'pending': return '#f59e0b'; // orange
        case 'failed': return '#ef4444'; // red
        case 'expired': return '#6b7280'; // gray
        default: return '#6b7280';
      }
    });

    return { labels, series, colors };
  };

  const userGrowthData = getUserGrowthData();
  const eventGrowthData = getEventGrowthData();
  const revenueGrowthData = getRevenueGrowthData();
  const topOrganizersData = getTopOrganizersData();
  const topEventsData = getTopEventsData();
  const categoryData = getCategoryDistributionData();
  const paymentStatusData = getPaymentStatusData();

  // Chart options
  const userGrowthOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 300,
      toolbar: { show: false },
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    xaxis: {
      categories: userGrowthData.categories,
      labels: {
        rotate: -45,
        style: {
          fontSize: '11px',
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
        formatter: (val: number) => `${val} users`,
      },
    },
    grid: {
      borderColor: '#e5e7eb',
    },
  };

  const eventGrowthOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 300,
      toolbar: { show: false },
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    xaxis: {
      categories: eventGrowthData.categories,
      labels: {
        rotate: -45,
        style: {
          fontSize: '11px',
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `${val}`,
      },
    },
    colors: ['#10b981'],
    tooltip: {
      y: {
        formatter: (val: number) => `${val} events`,
      },
    },
    grid: {
      borderColor: '#e5e7eb',
    },
  };

  const revenueGrowthOptions: ApexOptions = {
    chart: {
      type: 'line',
      height: 300,
      toolbar: { show: false },
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    xaxis: {
      categories: revenueGrowthData.categories,
      labels: {
        rotate: -45,
        style: {
          fontSize: '11px',
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `$${val.toFixed(0)}`,
      },
    },
    colors: ['#f59e0b'],
    tooltip: {
      y: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
    grid: {
      borderColor: '#e5e7eb',
    },
  };

  const topOrganizersOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false },
    },
    xaxis: {
      categories: topOrganizersData.labels,
      labels: {
        rotate: -45,
        style: {
          fontSize: '11px',
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
    colors: ['#8b5cf6'],
    tooltip: {
      y: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
      },
    },
  };

  const topEventsOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false },
    },
    xaxis: {
      categories: topEventsData.labels,
      labels: {
        rotate: -45,
        style: {
          fontSize: '11px',
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
    colors: ['#ec4899'],
    tooltip: {
      y: {
        formatter: (val: number) => formatCurrency(val),
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
      },
    },
  };

  const categoryDistributionOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 300,
    },
    labels: categoryData.labels,
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
    legend: {
      position: 'bottom',
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} events`,
      },
    },
  };

  const paymentStatusOptions: ApexOptions = {
    chart: {
      type: 'donut',
      height: 300,
    },
    labels: paymentStatusData.labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
    colors: paymentStatusData.colors,
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

  if (loading && !analytics) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  // Calculate totals
  const totalUsers = analytics?.userGrowth?.reduce((sum, item) => sum + item.count, 0) || 0;
  const totalEvents = analytics?.eventGrowth?.reduce((sum, item) => sum + item.count, 0) || 0;
  const totalRevenue = analytics?.revenueGrowth?.reduce((sum, item) => sum + (item.revenue || 0), 0) || 0;
  const totalPayments = analytics?.paymentStatusDistribution?.reduce((sum, item) => sum + item.count, 0) || 0;

  return (
    <>
      <PageMeta title="Platform Analytics - Superadmin" />
      <PageBreadcrumb pageName="Platform Analytics" />

      <div className="space-y-6 overflow-x-hidden">
        {/* Filters */}
        <ComponentCard>
          <div className="p-3 md:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="min-w-0">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year
                </label>
                <Select
                  value={yearFilter}
                  onChange={(value) => {
                    setYearFilter(value);
                    setDateRange([null, null]);
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
                  }}
                  format="YYYY-MM-DD"
                  size="large"
                />
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <ComponentCard>
            <div className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mt-2 truncate">
                    {totalUsers.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0 ml-2">
                  <UserOutlined className="text-xl sm:text-2xl text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard>
            <div className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Events</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mt-2 truncate">
                    {totalEvents.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0 ml-2">
                  <RiseOutlined className="text-xl sm:text-2xl text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard>
            <div className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mt-2 truncate">
                    {formatCurrency(totalRevenue)}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0 ml-2">
                  <DollarOutlined className="text-xl sm:text-2xl text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>
          </ComponentCard>

          <ComponentCard>
            <div className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Total Payments</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 mt-2 truncate">
                    {totalPayments.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0 ml-2">
                  <CalendarOutlined className="text-xl sm:text-2xl text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Growth Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <ComponentCard>
            <div className="p-3 md:p-4">
              <h3 className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
                User Growth
              </h3>
              <Chart
                options={userGrowthOptions}
                series={[{ name: 'Users', data: userGrowthData.series }]}
                type="line"
                height={300}
              />
            </div>
          </ComponentCard>

          <ComponentCard>
            <div className="p-3 md:p-4">
              <h3 className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Event Growth
              </h3>
              <Chart
                options={eventGrowthOptions}
                series={[{ name: 'Events', data: eventGrowthData.series }]}
                type="line"
                height={300}
              />
            </div>
          </ComponentCard>

          <ComponentCard>
            <div className="p-3 md:p-4">
              <h3 className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Revenue Growth
              </h3>
              <Chart
                options={revenueGrowthOptions}
                series={[{ name: 'Revenue', data: revenueGrowthData.series }]}
                type="line"
                height={300}
              />
            </div>
          </ComponentCard>
        </div>

        {/* Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <ComponentCard>
            <div className="p-3 md:p-4">
              <h3 className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Top Organizers by Revenue
              </h3>
              <Chart
                options={topOrganizersOptions}
                series={[{ name: 'Revenue', data: topOrganizersData.series }]}
                type="bar"
                height={300}
              />
            </div>
          </ComponentCard>

          <ComponentCard>
            <div className="p-3 md:p-4">
              <h3 className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Top Events by Revenue
              </h3>
              <Chart
                options={topEventsOptions}
                series={[{ name: 'Revenue', data: topEventsData.series }]}
                type="bar"
                height={300}
              />
            </div>
          </ComponentCard>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <ComponentCard>
            <div className="p-3 md:p-4">
              <h3 className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Events by Category
              </h3>
              <Chart
                options={categoryDistributionOptions}
                series={categoryData.series}
                type="donut"
                height={300}
              />
            </div>
          </ComponentCard>

          <ComponentCard>
            <div className="p-3 md:p-4">
              <h3 className="text-sm md:text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
                Payment Status Distribution
              </h3>
              <Chart
                options={paymentStatusOptions}
                series={paymentStatusData.series}
                type="donut"
                height={300}
              />
            </div>
          </ComponentCard>
        </div>
      </div>
    </>
  );
}

