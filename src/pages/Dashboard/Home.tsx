import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import axiosInstance from "../../utils/axiosInstance";
import { Spin, Select, DatePicker, Space } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getUserRole } from "../../utils/userRole";

const { RangePicker } = DatePicker;

interface DashboardStatistics {
  metrics: {
    totalParticipants: number;
    totalRevenue: number;
    activeEvents: number;
    totalEvents: number;
  };
  monthly: {
    participants: number[];
    revenue: number[];
  };
  quarterly: {
    participants: number[];
    revenue: number[];
  };
  annual: {
    participants: number;
    revenue: number;
  };
  currentMonth: {
    participants: number;
    revenue: number;
    target: number;
    progress: number;
  };
  topEvents: Array<{
    _id: string;
    title: string;
    location: string;
    type: string;
    multimedia: string[];
    participants: number;
    likes: number;
  }>;
}

export default function Home() {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  useEffect(() => {
    // Redirect Superadmin to their dashboard
    const role = getUserRole();
    if (role === 'Superadmin') {
      navigate('/superadmin/dashboard-stats');
      return;
    }
    
    // Only fetch statistics for EventOrganizer
    if (role === 'EventOrganizer') {
      fetchStatistics();
    }
  }, [navigate, yearFilter, dateRange]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (dateRange[0] && dateRange[1]) {
        params.append('startDate', dateRange[0].toISOString());
        params.append('endDate', dateRange[1].toISOString());
      } else {
        params.append('year', yearFilter.toString());
      }

      const response = await axiosInstance.get(`event/dashboard/statistics?${params.toString()}`);
      setStatistics(response.data);
    } catch (error) {
      console.error("Error fetching dashboard statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (value: number) => {
    setYearFilter(value);
    setDateRange([null, null]); // Clear date range when year is selected
  };

  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates) {
      setDateRange(dates);
      setYearFilter(new Date().getFullYear()); // Reset year filter
    } else {
      setDateRange([null, null]);
    }
  };

  // Generate year options (current year and previous 5 years)
  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year, label: year.toString() };
  });

  if (loading || !statistics) {
    const role = getUserRole();
    if (role === 'Superadmin') {
      return null; // Will redirect
    }
    
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <PageMeta title="HikeHub | Dashboard" description="" />
      
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

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          {/* Pass metrics to EcommerceMetrics */}
          <EcommerceMetrics metrics={statistics.metrics} />

          {/* Pass monthly data to MonthlySalesChart */}
          <MonthlySalesChart monthlyParticipants={statistics.monthly.participants} />
        </div>

        <div className="col-span-12 xl:col-span-5">
          {/* Pass current month data to MonthlyTarget */}
          <MonthlyTarget 
            currentMonthRevenue={statistics.currentMonth.revenue}
            targetRevenue={statistics.currentMonth.target}
            progress={statistics.currentMonth.progress}
          />
        </div>

        <div className="col-span-12">
          {/* Pass statistics data to StatisticsChart */}
          <StatisticsChart 
            monthlyParticipants={statistics.monthly.participants}
            monthlyRevenue={statistics.monthly.revenue}
            quarterlyParticipants={statistics.quarterly.participants}
            quarterlyRevenue={statistics.quarterly.revenue}
            annualParticipants={statistics.annual.participants}
            annualRevenue={statistics.annual.revenue}
          />
        </div>

        <div className="col-span-12 xl:col-span-7">
          {/* Pass top events to RecentOrders */}
          <RecentOrders topEvents={statistics.topEvents} />
        </div>
      </div>
    </>
  );
}