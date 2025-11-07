import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { getUserRole } from "../../utils/userRole";
import axiosInstance from "../../utils/axiosInstance";
import { Spin, Select, DatePicker, Space } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import "../../index.css";

const { RangePicker } = DatePicker;

interface DashboardStats {
  users: {
    total: number;
    organizers: number;
    hikers: number;
    superadmins: number;
  };
  events: {
    total: number;
    byStatus: Record<string, number>;
  };
  payments: {
    total: number;
    totalRevenue: number;
    byStatus: Record<string, number>;
  };
  organizers: {
    byStatus: Record<string, number>;
  };
  recent: {
    users: Array<{
      _id: string;
      username: string;
      email: string;
      role: string;
      createdAt: string;
    }>;
    events: Array<{
      _id: string;
      title: string;
      status: string;
      createdAt: string;
      organizer: {
        username: string;
      };
    }>;
    payments: Array<{
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
    }>;
  };
}

export default function DashboardStats() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  useEffect(() => {
    const role = getUserRole();
    if (role !== 'Superadmin') {
      navigate('/superadmin');
      return;
    }
    fetchStats();
  }, [navigate, yearFilter, dateRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (dateRange[0] && dateRange[1]) {
        params.append('startDate', dateRange[0].toISOString());
        params.append('endDate', dateRange[1].toISOString());
      } else {
        params.append('year', yearFilter.toString());
      }

      const response = await axiosInstance.get(`superadmin/dashboard?${params.toString()}`);
      if (response.data.status === 1) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (value: number) => {
    setYearFilter(value);
    setDateRange([null, null]);
  };

  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates) {
      setDateRange(dates);
      setYearFilter(new Date().getFullYear());
    } else {
      setDateRange([null, null]);
    }
  };

  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year, label: year.toString() };
  });

  // Prepare chart data for events by status with semantic colors
  const getEventsStatusData = () => {
    if (!stats?.events.byStatus) return { series: [], labels: [], colors: [] };
    
    const statusOrder = ['Approved', 'Pending', 'Rejected', 'Unknown'];
    const statusColors: Record<string, string> = {
      'Approved': '#10B981', // Green - positive
      'Pending': '#F59E0B',  // Orange/Yellow - neutral/waiting
      'Rejected': '#EF4444', // Red - negative
      'Unknown': '#6B7280',  // Gray - unknown
    };
    
    const labels = statusOrder.filter(status => stats.events.byStatus[status]);
    const series = labels.map(status => stats.events.byStatus[status]);
    const colors = labels.map(status => statusColors[status] || '#6B7280');
    
    return { series, labels, colors };
  };

  // Prepare chart data for payments by status with semantic colors
  const getPaymentsStatusData = () => {
    if (!stats?.payments.byStatus) return { series: [], labels: [], colors: [] };
    
    const statusOrder = ['verified', 'pending', 'failed', 'expired', 'Unknown'];
    const statusColors: Record<string, string> = {
      'verified': '#10B981', // Green - positive/success
      'pending': '#F59E0B',  // Orange/Yellow - waiting
      'failed': '#EF4444',   // Red - negative/failure
      'expired': '#6B7280',  // Gray - expired
      'Unknown': '#6B7280',  // Gray - unknown
    };
    
    const labels = statusOrder.filter(status => stats.payments.byStatus[status]);
    const series = labels.map(status => stats.payments.byStatus[status]);
    const colors = labels.map(status => statusColors[status] || '#6B7280');
    
    return { series, labels, colors };
  };

  // Prepare chart data for organizers by status with semantic colors
  const getOrganizersStatusData = () => {
    if (!stats?.organizers.byStatus) return { series: [], labels: [], colors: [] };
    
    const statusOrder = ['Approved', 'Pending', 'Rejected', 'Incomplete', 'Unknown'];
    const statusColors: Record<string, string> = {
      'Approved': '#10B981',   // Green - positive
      'Pending': '#F59E0B',    // Orange/Yellow - waiting
      'Rejected': '#EF4444',   // Red - negative
      'Incomplete': '#6B7280', // Gray - incomplete
      'Unknown': '#6B7280',    // Gray - unknown
    };
    
    const labels = statusOrder.filter(status => stats.organizers.byStatus[status]);
    const series = labels.map(status => stats.organizers.byStatus[status]);
    const colors = labels.map(status => statusColors[status] || '#6B7280');
    
    return { series, labels, colors };
  };

  const eventsStatusData = getEventsStatusData();
  const paymentsStatusData = getPaymentsStatusData();
  const organizersStatusData = getOrganizersStatusData();

  // Donut chart options for status distributions
  const getDonutChartOptions = (labels: string[], colors: string[]): ApexOptions => ({
    chart: {
      type: 'donut',
      fontFamily: 'Outfit, sans-serif',
    },
    labels,
    legend: {
      position: 'bottom',
      fontSize: '12px',
      fontFamily: 'Outfit, sans-serif',
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: {
        fontSize: '12px',
        fontFamily: 'Outfit, sans-serif',
      },
    },
    colors,
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
        },
      },
    },
  });

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }


  return (
    <>
      <PageMeta title="HikeHub | Dashboard Statistics" description="Superadmin dashboard statistics" />
      <PageBreadcrumb pageTitle="Dashboard Statistics" />

      {/* Filter Controls */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <CalendarOutlined className="text-gray-500 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by:</span>
        </div>
        <Space direction="horizontal" size="middle">
          <Select
            value={yearFilter}
            onChange={handleYearChange}
            style={{ width: 120 }}
            options={yearOptions}
            disabled={dateRange[0] !== null || dateRange[1] !== null}
          />
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
            placeholder={["Start Date", "End Date"]}
            disabledDate={(current) => current && current > dayjs().endOf("day")}
          />
        </Space>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <ComponentCard>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-xl">👥</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.users.total.toLocaleString()}</p>
            <div className="mt-2 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Organizers: {stats.users.organizers}</span>
              <span>Hikers: {stats.users.hikers}</span>
            </div>
          </div>
        </ComponentCard>

        <ComponentCard>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Events</p>
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-xl">📅</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.events.total.toLocaleString()}</p>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Approved: {stats.events.byStatus['Approved'] || 0} | Pending: {stats.events.byStatus['Pending'] || 0}
            </div>
          </div>
        </ComponentCard>

        <ComponentCard>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Payments</p>
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 text-xl">💳</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.payments.total.toLocaleString()}</p>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Verified: {stats.payments.byStatus['verified'] || 0}
            </div>
          </div>
        </ComponentCard>

        <ComponentCard>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                <span className="text-amber-600 dark:text-amber-400 text-xl">💰</span>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">
              {stats.payments.totalRevenue.toLocaleString()} ETB
            </p>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              From verified payments
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* Status Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ComponentCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Events by Status</h3>
            {eventsStatusData.series.length > 0 ? (
              <Chart
                options={getDonutChartOptions(eventsStatusData.labels, eventsStatusData.colors)}
                series={eventsStatusData.series}
                type="donut"
                height={300}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No data available</p>
            )}
          </div>
        </ComponentCard>

        <ComponentCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Payments by Status</h3>
            {paymentsStatusData.series.length > 0 ? (
              <Chart
                options={getDonutChartOptions(paymentsStatusData.labels, paymentsStatusData.colors)}
                series={paymentsStatusData.series}
                type="donut"
                height={300}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No data available</p>
            )}
          </div>
        </ComponentCard>

        <ComponentCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">Organizers by Status</h3>
            {organizersStatusData.series.length > 0 ? (
              <Chart
                options={getDonutChartOptions(organizersStatusData.labels, organizersStatusData.colors)}
                series={organizersStatusData.series}
                type="donut"
                height={300}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No data available</p>
            )}
          </div>
        </ComponentCard>
      </div>

      {/* Recent Activity Charts */}
      <div className="space-y-6">
        <ComponentCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">Recent Users by Role</h3>
            {stats.recent.users.length > 0 ? (
              (() => {
                // Group users by role
                const roleCounts = stats.recent.users.reduce((acc: Record<string, number>, user) => {
                  acc[user.role] = (acc[user.role] || 0) + 1;
                  return acc;
                }, {});

                const roleLabels = Object.keys(roleCounts);
                const roleValues = Object.values(roleCounts);
                const roleColors = roleLabels.map(role => {
                  if (role === 'Superadmin') return '#EF4444';
                  if (role === 'EventOrganizer') return '#465FFF';
                  return '#10B981'; // Hiker
                });

                return (
                  <Chart
                    options={{
                      chart: {
                        type: 'bar',
                        fontFamily: 'Outfit, sans-serif',
                        toolbar: { show: false },
                      },
                      plotOptions: {
                        bar: {
                          horizontal: false,
                          columnWidth: '60%',
                          borderRadius: 5,
                          borderRadiusApplication: 'end',
                        },
                      },
                      dataLabels: {
                        enabled: true,
                        formatter: (val: number) => val.toString(),
                      },
                      xaxis: {
                        categories: roleLabels,
                        labels: {
                          style: {
                            fontFamily: 'Outfit, sans-serif',
                          },
                        },
                      },
                      yaxis: {
                        title: {
                          text: 'Number of Users',
                          style: {
                            fontFamily: 'Outfit, sans-serif',
                          },
                        },
                      },
                      colors: roleColors,
                      tooltip: {
                        y: {
                          formatter: (val: number) => `${val} users`,
                        },
                      },
                    }}
                    series={[{ name: 'Users', data: roleValues }]}
                    type="bar"
                    height={300}
                  />
                );
              })()
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent users data available</p>
            )}
          </div>
        </ComponentCard>

        <ComponentCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">Recent Events by Status</h3>
            {stats.recent.events.length > 0 ? (
              (() => {
                // Group events by status
                const statusCounts = stats.recent.events.reduce((acc: Record<string, number>, event) => {
                  acc[event.status] = (acc[event.status] || 0) + 1;
                  return acc;
                }, {});

                const statusLabels = Object.keys(statusCounts);
                const statusValues = Object.values(statusCounts);
                const statusColors = statusLabels.map(status => {
                  if (status === 'Approved') return '#10B981';
                  if (status === 'Pending') return '#F59E0B';
                  if (status === 'Rejected') return '#EF4444';
                  return '#6B7280';
                });

                return (
                  <Chart
                    options={{
                      chart: {
                        type: 'bar',
                        fontFamily: 'Outfit, sans-serif',
                        toolbar: { show: false },
                      },
                      plotOptions: {
                        bar: {
                          horizontal: false,
                          columnWidth: '60%',
                          borderRadius: 5,
                          borderRadiusApplication: 'end',
                        },
                      },
                      dataLabels: {
                        enabled: true,
                        formatter: (val: number) => val.toString(),
                      },
                      xaxis: {
                        categories: statusLabels,
                        labels: {
                          style: {
                            fontFamily: 'Outfit, sans-serif',
                          },
                        },
                      },
                      yaxis: {
                        title: {
                          text: 'Number of Events',
                          style: {
                            fontFamily: 'Outfit, sans-serif',
                          },
                        },
                      },
                      colors: statusColors,
                      tooltip: {
                        y: {
                          formatter: (val: number) => `${val} events`,
                        },
                      },
                    }}
                    series={[{ name: 'Events', data: statusValues }]}
                    type="bar"
                    height={300}
                  />
                );
              })()
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent events data available</p>
            )}
          </div>
        </ComponentCard>

        <ComponentCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">Recent Payments Trend</h3>
            {stats.recent.payments.length > 0 ? (
              (() => {
                // Sort payments by date and group by status
                const sortedPayments = [...stats.recent.payments].sort((a, b) => 
                  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );

                // Get last 10 payments for trend
                const recentPayments = sortedPayments.slice(-10);
                const dates = recentPayments.map(p => 
                  new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                );
                const amounts = recentPayments.map(p => p.amount);
                const statuses = recentPayments.map(p => p.status);

                return (
                  <Chart
                    options={{
                      chart: {
                        type: 'line',
                        fontFamily: 'Outfit, sans-serif',
                        toolbar: { show: false },
                        zoom: { enabled: false },
                      },
                      stroke: {
                        curve: 'smooth',
                        width: 3,
                      },
                      markers: {
                        size: 5,
                        hover: {
                          size: 7,
                        },
                      },
                      xaxis: {
                        categories: dates,
                        labels: {
                          style: {
                            fontFamily: 'Outfit, sans-serif',
                          },
                        },
                      },
                      yaxis: {
                        title: {
                          text: 'Amount (ETB)',
                          style: {
                            fontFamily: 'Outfit, sans-serif',
                          },
                        },
                        labels: {
                          formatter: (val: number) => `${val.toLocaleString()}`,
                        },
                      },
                      colors: ['#465FFF'],
                      tooltip: {
                        y: {
                          formatter: (val: number, opts: any) => {
                            const status = statuses[opts.dataPointIndex];
                            const statusColor = status === 'verified' ? '#10B981' : status === 'pending' ? '#F59E0B' : '#EF4444';
                            return `<div>
                              <div>Amount: ${val.toLocaleString()} ETB</div>
                              <div style="color: ${statusColor}">Status: ${status}</div>
                            </div>`;
                          },
                        },
                      },
                      dataLabels: {
                        enabled: false,
                      },
                    }}
                    series={[{ name: 'Payment Amount', data: amounts }]}
                    type="line"
                    height={300}
                  />
                );
              })()
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent payments data available</p>
            )}
          </div>
        </ComponentCard>

        <ComponentCard>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-6">Payment Status Distribution (Recent)</h3>
            {stats.recent.payments.length > 0 ? (
              (() => {
                // Group payments by status
                const statusCounts = stats.recent.payments.reduce((acc: Record<string, number>, payment) => {
                  acc[payment.status] = (acc[payment.status] || 0) + 1;
                  return acc;
                }, {});

                const statusLabels = Object.keys(statusCounts);
                const statusValues = Object.values(statusCounts);
                const statusColors = statusLabels.map(status => {
                  if (status === 'verified') return '#10B981';
                  if (status === 'pending') return '#F59E0B';
                  if (status === 'failed') return '#EF4444';
                  return '#6B7280';
                });

                return (
                  <Chart
                    options={{
                      chart: {
                        type: 'donut',
                        fontFamily: 'Outfit, sans-serif',
                      },
                      labels: statusLabels.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
                      legend: {
                        position: 'bottom',
                        fontSize: '12px',
                        fontFamily: 'Outfit, sans-serif',
                      },
                      dataLabels: {
                        enabled: true,
                        formatter: (val: number) => `${val.toFixed(1)}%`,
                      },
                      colors: statusColors,
                      plotOptions: {
                        pie: {
                          donut: {
                            size: '65%',
                          },
                        },
                      },
                    }}
                    series={statusValues}
                    type="donut"
                    height={300}
                  />
                );
              })()
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent payments data available</p>
            )}
          </div>
        </ComponentCard>
      </div>
    </>
  );
}

