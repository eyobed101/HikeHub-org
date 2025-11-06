import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../utils/axiosInstance";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadcrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { Spin, Select, DatePicker, Space, Table, Tag, Input } from "antd";
import { CalendarOutlined, SearchOutlined, EyeOutlined, HeartOutlined, UserOutlined, TrophyOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { shortenUrl, isValidUrl, formatUrl } from "../../utils/urlShortener";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

const { RangePicker } = DatePicker;

interface Event {
  _id: string;
  title: string;
  location: string;
  status: string;
  views: number;
  numberOfLikes: number;
  bookedParticipants: string[];
  maxParticipants: number;
  price: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  multimedia: string[];
  type: string;
  level: string;
}

interface EngagementMetrics {
  totalViews: number;
  totalLikes: number;
  totalParticipants: number;
  averageEngagementRate: number;
  topPerformingEvent: Event | null;
  engagementTrend: {
    labels: string[];
    views: number[];
    likes: number[];
    participants: number[];
  };
  statusDistribution: {
    approved: number;
    pending: number;
    rejected: number;
  };
  typeDistribution: Record<string, number>;
}

export default function EngagementAnalytics() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [metrics, setMetrics] = useState<EngagementMetrics | null>(null);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: "1",
        limit: "1000", // Get all events for analytics
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (dateRange[0] && dateRange[1]) {
        params.append('startDateFrom', dateRange[0].format('YYYY-MM-DD'));
        params.append('startDateTo', dateRange[1].format('YYYY-MM-DD'));
      }

      if (statusFilter !== "all") {
        params.append('status', statusFilter);
      }

      const response = await axiosInstance.get(`event/organizer/all?${params.toString()}`);
      const eventData = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      
      setEvents(eventData);
      setFilteredEvents(eventData);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, statusFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Calculate metrics
  useEffect(() => {
    if (filteredEvents.length === 0) {
      setMetrics(null);
      return;
    }

    const totalViews = filteredEvents.reduce((sum, event) => sum + (event.views || 0), 0);
    const totalLikes = filteredEvents.reduce((sum, event) => sum + (event.numberOfLikes || 0), 0);
    const totalParticipants = filteredEvents.reduce(
      (sum, event) => sum + (event.bookedParticipants?.length || 0),
      0
    );

    // Calculate average engagement rate (views + likes + participants) / total events
    const totalEngagement = totalViews + totalLikes + totalParticipants;
    const averageEngagementRate = filteredEvents.length > 0 
      ? (totalEngagement / filteredEvents.length).toFixed(1)
      : 0;

    // Find top performing event (highest combined engagement)
    const topPerformingEvent = filteredEvents.reduce((top, event) => {
      const eventEngagement = (event.views || 0) + (event.numberOfLikes || 0) + (event.bookedParticipants?.length || 0);
      const topEngagement = (top.views || 0) + (top.numberOfLikes || 0) + (top.bookedParticipants?.length || 0);
      return eventEngagement > topEngagement ? event : top;
    }, filteredEvents[0]);

    // Group events by month for trend analysis
    const monthlyData: Record<string, { views: number; likes: number; participants: number }> = {};
    
    filteredEvents.forEach(event => {
      const month = dayjs(event.createdAt).format('MMM YYYY');
      if (!monthlyData[month]) {
        monthlyData[month] = { views: 0, likes: 0, participants: 0 };
      }
      monthlyData[month].views += event.views || 0;
      monthlyData[month].likes += event.numberOfLikes || 0;
      monthlyData[month].participants += event.bookedParticipants?.length || 0;
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => 
      dayjs(a, 'MMM YYYY').valueOf() - dayjs(b, 'MMM YYYY').valueOf()
    );

    // Status distribution
    const statusDistribution = {
      approved: filteredEvents.filter(e => e.status === 'Approved').length,
      pending: filteredEvents.filter(e => e.status === 'Pending').length,
      rejected: filteredEvents.filter(e => e.status === 'Rejected').length,
    };

    // Type distribution
    const typeDistribution: Record<string, number> = {};
    filteredEvents.forEach(event => {
      const type = event.type || 'Unknown';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    setMetrics({
      totalViews,
      totalLikes,
      totalParticipants,
      averageEngagementRate: parseFloat(averageEngagementRate),
      topPerformingEvent: topPerformingEvent || null,
      engagementTrend: {
        labels: sortedMonths,
        views: sortedMonths.map(month => monthlyData[month].views),
        likes: sortedMonths.map(month => monthlyData[month].likes),
        participants: sortedMonths.map(month => monthlyData[month].participants),
      },
      statusDistribution,
      typeDistribution,
    });
  }, [filteredEvents]);

  // Handle search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredEvents(events);
      return;
    }

    const filtered = events.filter(event =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredEvents(filtered);
  }, [searchQuery, events]);

  const handleYearChange = (value: number) => {
    setYearFilter(value);
    setDateRange([null, null]);
  };

  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates) {
      setDateRange(dates);
    } else {
      setDateRange([null, null]);
    }
  };

  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year, label: year.toString() };
  });

  // ApexCharts options
  const engagementTrendOptions: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "line",
      height: 350,
      toolbar: { show: false },
    },
    colors: ["#3B82F6", "#10B981", "#F59E0B"],
    stroke: {
      curve: "smooth",
      width: 3,
    },
    markers: {
      size: 5,
      hover: { size: 7 },
    },
    xaxis: {
      categories: metrics?.engagementTrend.labels || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: { text: "Engagement" },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
    },
    grid: {
      yaxis: { lines: { show: true } },
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
  };

  const engagementTrendSeries = metrics ? [
    { name: "Views", data: metrics.engagementTrend.views },
    { name: "Likes", data: metrics.engagementTrend.likes },
    { name: "Participants", data: metrics.engagementTrend.participants },
  ] : [];

  const statusDistributionOptions: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 350,
    },
    colors: ["#10B981", "#F59E0B", "#EF4444"],
    labels: ["Approved", "Pending", "Rejected"],
    legend: {
      position: "bottom",
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
  };

  const statusDistributionSeries = metrics ? [
    metrics.statusDistribution.approved,
    metrics.statusDistribution.pending,
    metrics.statusDistribution.rejected,
  ] : [];

  const typeDistributionOptions: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 350,
      toolbar: { show: false },
    },
    colors: ["#3B82F6"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 5,
      },
    },
    xaxis: {
      categories: metrics ? Object.keys(metrics.typeDistribution) : [],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: { text: "Number of Events" },
    },
    dataLabels: {
      enabled: false,
    },
    grid: {
      yaxis: { lines: { show: true } },
    },
  };

  const typeDistributionSeries = metrics ? [
    {
      name: "Events",
      data: Object.values(metrics.typeDistribution),
    },
  ] : [];

  // Table columns
  const columns = [
    {
      title: 'Event Title',
      dataIndex: 'title',
      key: 'title',
      sorter: (a: Event, b: Event) => a.title.localeCompare(b.title),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      render: (location: string) => (
        isValidUrl(location) ? (
          <a
            href={formatUrl(location)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 hover:underline"
            title={location}
          >
            {shortenUrl(location, 30)}
          </a>
        ) : (
          <span>{location}</span>
        )
      ),
    },
    {
      title: 'Views',
      dataIndex: 'views',
      key: 'views',
      sorter: (a: Event, b: Event) => (a.views || 0) - (b.views || 0),
      render: (views: number) => views?.toLocaleString() || 0,
    },
    {
      title: 'Likes',
      dataIndex: 'numberOfLikes',
      key: 'likes',
      sorter: (a: Event, b: Event) => (a.numberOfLikes || 0) - (b.numberOfLikes || 0),
      render: (likes: number) => likes?.toLocaleString() || 0,
    },
    {
      title: 'Participants',
      dataIndex: 'bookedParticipants',
      key: 'participants',
      sorter: (a: Event, b: Event) => 
        (a.bookedParticipants?.length || 0) - (b.bookedParticipants?.length || 0),
      render: (participants: string[]) => participants?.length || 0,
    },
    {
      title: 'Engagement Score',
      key: 'engagement',
      sorter: (a: Event, b: Event) => {
        const scoreA = (a.views || 0) + (a.numberOfLikes || 0) + (a.bookedParticipants?.length || 0);
        const scoreB = (b.views || 0) + (b.numberOfLikes || 0) + (b.bookedParticipants?.length || 0);
        return scoreA - scoreB;
      },
      render: (_: any, record: Event) => {
        const score = (record.views || 0) + (record.numberOfLikes || 0) + (record.bookedParticipants?.length || 0);
        return <span className="font-semibold">{score.toLocaleString()}</span>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Approved', value: 'Approved' },
        { text: 'Pending', value: 'Pending' },
        { text: 'Rejected', value: 'Rejected' },
      ],
      onFilter: (value: any, record: Event) => record.status === value,
      render: (status: string) => {
        const color = status === 'Approved' ? 'green' : status === 'Pending' ? 'orange' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <PageMeta title="HikeHub | Engagement Analytics" description="" />
      <PageBreadcrumb pageTitle="Engagement Analytics" />

      <div className="space-y-6">
        {/* Filters */}
        <ComponentCard title="">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarOutlined className="text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
            </div>
            <Space direction="horizontal" size="middle" className="flex-wrap">
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 120 }}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'Approved', label: 'Approved' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Rejected', label: 'Rejected' },
                ]}
              />
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
        </ComponentCard>

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-4">
                <EyeOutlined className="text-blue-600 dark:text-blue-400 text-xl" />
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Views</span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {metrics.totalViews.toLocaleString()}
                </h4>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl mb-4">
                <HeartOutlined className="text-pink-600 dark:text-pink-400 text-xl" />
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Likes</span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {metrics.totalLikes.toLocaleString()}
                </h4>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl mb-4">
                <UserOutlined className="text-green-600 dark:text-green-400 text-xl" />
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Participants</span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {metrics.totalParticipants.toLocaleString()}
                </h4>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl mb-4">
                <TrophyOutlined className="text-purple-600 dark:text-purple-400 text-xl" />
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Avg Engagement Rate</span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {metrics.averageEngagementRate.toLocaleString()}
                </h4>
              </div>
            </div>
          </div>
        )}

        {/* Top Performing Event */}
        {metrics?.topPerformingEvent && (
          <ComponentCard title="Top Performing Event">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {metrics.topPerformingEvent.multimedia && metrics.topPerformingEvent.multimedia.length > 0 && (
                <img
                  src={metrics.topPerformingEvent.multimedia[0].startsWith('http')
                    ? metrics.topPerformingEvent.multimedia[0]
                    : `http://localhost:3030/uploads/${metrics.topPerformingEvent.multimedia[0]}`}
                  alt={metrics.topPerformingEvent.title}
                  className="w-full md:w-48 h-48 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-2">
                  {metrics.topPerformingEvent.title}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Views</span>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                      {(metrics.topPerformingEvent.views || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Likes</span>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                      {(metrics.topPerformingEvent.numberOfLikes || 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Participants</span>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                      {metrics.topPerformingEvent.bookedParticipants?.length || 0}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Engagement Score</span>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white/90">
                      {((metrics.topPerformingEvent.views || 0) + 
                        (metrics.topPerformingEvent.numberOfLikes || 0) + 
                        (metrics.topPerformingEvent.bookedParticipants?.length || 0)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ComponentCard>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Engagement Trend */}
          {metrics && engagementTrendSeries.length > 0 && (
            <ComponentCard title="Engagement Trend Over Time">
              <div className="max-w-full overflow-x-auto custom-scrollbar">
                <Chart
                  options={engagementTrendOptions}
                  series={engagementTrendSeries}
                  type="line"
                  height={350}
                />
              </div>
            </ComponentCard>
          )}

          {/* Status Distribution */}
          {metrics && statusDistributionSeries.length > 0 && (
            <ComponentCard title="Events by Status">
              <div className="max-w-full overflow-x-auto custom-scrollbar">
                <Chart
                  options={statusDistributionOptions}
                  series={statusDistributionSeries}
                  type="donut"
                  height={350}
                />
              </div>
            </ComponentCard>
          )}

          {/* Type Distribution */}
          {metrics && typeDistributionSeries.length > 0 && (
            <ComponentCard title="Events by Type">
              <div className="max-w-full overflow-x-auto custom-scrollbar">
                <Chart
                  options={typeDistributionOptions}
                  series={typeDistributionSeries}
                  type="bar"
                  height={350}
                />
              </div>
            </ComponentCard>
          )}
        </div>

        {/* Events Table */}
        <ComponentCard title="All Events Engagement Data">
          <Table
            columns={columns}
            dataSource={filteredEvents}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} events`,
            }}
            scroll={{ x: 'max-content' }}
          />
        </ComponentCard>
      </div>
    </>
  );
}

