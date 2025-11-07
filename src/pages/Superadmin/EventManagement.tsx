import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { getUserRole } from "../../utils/userRole";
import axiosInstance, { ensureValidToken } from "../../utils/axiosInstance";
import { Spin, Input, Select, Table, Badge, Button, Space, message, DatePicker } from "antd";
import { SearchOutlined, EyeOutlined, EditOutlined } from "@ant-design/icons";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import ButtonComponent from "../../components/ui/button/Button";
import { shortenUrl, isValidUrl, formatUrl } from "../../utils/urlShortener";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

interface Event {
  _id: string;
  title: string;
  description: string;
  location: string;
  organizer: {
    _id: string;
    username: string;
    email: string;
  };
  categories?: {
    _id: string;
    name: string;
  };
  price: number;
  priceDiscount?: number;
  maxParticipants: number;
  bookedParticipants?: string[];
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  type: 'Day' | 'Backpacking' | 'Thru Hiking' | 'Camping';
  level: 'Easy' | 'Intermediate' | 'Challenging' | 'Difficult' | 'Very Difficult';
  views: number;
  numberOfLikes: number;
  rating: number;
  ratingCount: number;
  multimedia?: string[];
  itinerary?: string[];
  transportation?: string;
  weatherCondition?: string;
  meetingPlace?: string;
  meetingTime?: string;
  announcement?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function EventManagement() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 30,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusReason, setStatusReason] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check role on mount
  useEffect(() => {
    const role = getUserRole();
    if (role !== 'Superadmin') {
      navigate('/home');
    }
  }, [navigate]);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.currentPage,
        limit: pagination.itemsPerPage,
      };

      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery;
      }

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (dateRange[0] && dateRange[1]) {
        params.startDateFrom = dateRange[0].format('YYYY-MM-DD');
        params.startDateTo = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await axiosInstance.get('superadmin/events', { params });
      
      if (response.data.status === 1) {
        setEvents(response.data.data || []);
        setPagination({
          currentPage: response.data.pagination.currentPage,
          totalPages: response.data.pagination.totalPages,
          totalItems: response.data.pagination.totalItems,
          itemsPerPage: response.data.pagination.itemsPerPage,
          hasNextPage: response.data.pagination.hasNextPage,
          hasPrevPage: response.data.pagination.hasPrevPage,
        });
      } else {
        message.error(response.data.message || "Failed to fetch events");
      }
    } catch (error: any) {
      console.error("Error fetching events:", error);
      message.error(error.response?.data?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage, debouncedSearchQuery, statusFilter, dateRange]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle view event
  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setViewModalOpen(true);
  };

  // Handle manage event (status update)
  const handleManageEvent = (event: Event) => {
    setSelectedEvent(event);
    setNewStatus(event.status);
    setStatusReason("");
    setManageModalOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedEvent || !selectedEvent._id) {
      message.error("Invalid event data. Please try again.");
      return;
    }

    const eventId = selectedEvent._id;

    // Check if status changed
    const hasStatusChange = newStatus && newStatus !== selectedEvent.status;

    // If nothing changed, show warning
    if (!hasStatusChange) {
      message.warning("No changes detected. Please modify the status.");
      return;
    }

    try {
      setActionLoading(true);
      
      // Proactively refresh token if needed before making requests
      const validToken = await ensureValidToken();
      if (!validToken) {
        message.error("Your session has expired. Please log in again.");
        return;
      }

      const statusResponse = await axiosInstance.put(`superadmin/events/${eventId}/status`, {
        status: newStatus,
        reason: statusReason || undefined,
      });

      if (statusResponse.data.status === 1) {
        message.success(`Event status updated to ${newStatus} successfully`);
        setManageModalOpen(false);
        fetchEvents();
      } else {
        throw new Error(statusResponse.data.message || "Status update failed");
      }
    } catch (error: any) {
      console.error("Error updating event status:", error);
      // If it's a 401, the session might have expired during the request
      if (error.response?.status === 401 || error.message?.includes("Session expired")) {
        message.error("Your session has expired. Please log in again.");
        return;
      }
      message.error(error.response?.data?.message || "Failed to update event status");
    } finally {
      setActionLoading(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge status="success" text="Approved" />;
      case 'Pending':
        return <Badge status="processing" text="Pending" />;
      case 'Rejected':
        return <Badge status="error" text="Rejected" />;
      default:
        return <Badge status="default" text={status} />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
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

  // Format date time
  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Event',
      key: 'event',
      width: 200,
      fixed: 'left' as const,
      render: (record: Event) => (
        <div className="flex items-center gap-2 min-w-0">
          {record.multimedia && record.multimedia.length > 0 ? (
            <img
              src={record.multimedia[0]}
              alt={record.title}
              className="w-10 h-10 object-cover rounded-lg flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/user/user-01.jpg';
              }}
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-gray-400 text-[10px]">No Img</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-800 dark:text-gray-200 text-xs truncate" title={record.title}>
              {record.title}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate" title={record.organizer?.username || 'N/A'}>
              {record.organizer?.username || 'N/A'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      render: (location: string) => {
        if (!location) return <span className="text-gray-500 dark:text-gray-400 text-xs">N/A</span>;
        if (isValidUrl(location)) {
          const formattedUrl = formatUrl(location);
          const shortened = shortenUrl(formattedUrl, 20);
          return (
            <a
              href={formattedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline text-xs truncate block"
              title={formattedUrl}
            >
              {shortened}
            </a>
          );
        }
        return <span className="text-gray-800 dark:text-gray-200 text-xs truncate block" title={location}>{location}</span>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 110,
      render: (date: string) => (
        <span className="text-gray-800 dark:text-gray-200 text-xs">{formatDate(date)}</span>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 80,
      render: (price: number) => (
        <span className="text-gray-800 dark:text-gray-200 text-xs">${price?.toFixed(2) || '0.00'}</span>
      ),
    },
    {
      title: 'Views',
      dataIndex: 'views',
      key: 'views',
      width: 70,
      render: (views: number) => (
        <span className="text-gray-800 dark:text-gray-200 text-xs">{views || 0}</span>
      ),
    },
    {
      title: 'Likes',
      dataIndex: 'numberOfLikes',
      key: 'numberOfLikes',
      width: 70,
      render: (likes: number) => (
        <span className="text-gray-800 dark:text-gray-200 text-xs">{likes || 0}</span>
      ),
    },
    {
      title: 'Participants',
      key: 'participants',
      width: 100,
      render: (record: Event) => (
        <span className="text-gray-800 dark:text-gray-200 text-xs">
          {record.bookedParticipants?.length || 0} / {record.maxParticipants || 0}
        </span>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (date: string) => (
        <span className="text-gray-800 dark:text-gray-200 text-xs">{formatDate(date)}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      fixed: 'right' as const,
      render: (record: Event) => (
        <Space size="small" className="flex-wrap">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewEvent(record)}
            className="text-blue-600 dark:text-blue-400 p-0 h-auto text-xs"
            size="small"
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleManageEvent(record)}
            className="text-green-600 dark:text-green-400 p-0 h-auto text-xs"
            size="small"
          >
            Manage
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Event Management - Superadmin" />
      <PageBreadcrumb pageName="Event Management" />

      <ComponentCard>
        <div className="p-4 md:p-6 overflow-x-hidden">
          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="min-w-0">
              <Label className="text-sm">Search</Label>
              <Input
                placeholder="Search events..."
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1"
                size="large"
                allowClear
              />
            </div>
            <div className="min-w-0">
              <Label className="text-sm">Status</Label>
              <Select
                placeholder="All Statuses"
                value={statusFilter || undefined}
                onChange={(value) => {
                  setStatusFilter(value);
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
                className="w-full mt-1"
                size="large"
                allowClear
              >
                <Option value="Pending">Pending</Option>
                <Option value="Approved">Approved</Option>
                <Option value="Rejected">Rejected</Option>
              </Select>
            </div>
            <div className="min-w-0">
              <Label className="text-sm">Date Range</Label>
              <RangePicker
                className="w-full mt-1"
                value={dateRange}
                onChange={(dates) => {
                  if (dates) {
                    setDateRange([dates[0], dates[1]]);
                  } else {
                    setDateRange([null, null]);
                  }
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
                format="YYYY-MM-DD"
                size="large"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Spin spinning={loading}>
              <Table
                columns={columns}
                dataSource={events}
                rowKey="_id"
                pagination={{
                  current: pagination.currentPage,
                  total: pagination.totalItems,
                  pageSize: pagination.itemsPerPage,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  pageSizeOptions: ['10', '20', '30', '50', '100'],
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} events`,
                  onChange: (page, pageSize) => {
                    setPagination(prev => ({
                      ...prev,
                      currentPage: page,
                      itemsPerPage: pageSize || prev.itemsPerPage,
                    }));
                  },
                  onShowSizeChange: (current, size) => {
                    setPagination(prev => ({
                      ...prev,
                      currentPage: 1,
                      itemsPerPage: size,
                    }));
                  },
                }}
                scroll={{ x: 1200 }}
                size="middle"
                className="[&_.ant-table-wrapper]:bg-transparent [&_.ant-table]:bg-white [&_.ant-table]:dark:bg-gray-900 [&_.ant-table-container]:bg-white [&_.ant-table-container]:dark:bg-gray-900 [&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:dark:bg-gray-800 [&_.ant-table-thead>tr>th]:px-3 [&_.ant-table-thead>tr>th]:py-2 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-xs [&_.ant-table-thead>tr>th]:text-gray-700 [&_.ant-table-thead>tr>th]:dark:text-gray-300 [&_.ant-table-tbody>tr>td]:px-3 [&_.ant-table-tbody>tr>td]:py-2 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr>td]:text-gray-800 [&_.ant-table-tbody>tr>td]:dark:text-gray-200 [&_.ant-table-tbody>tr]:bg-white [&_.ant-table-tbody>tr]:dark:bg-gray-900 [&_.ant-table-tbody>tr:hover]:bg-gray-50 [&_.ant-table-tbody>tr:hover]:dark:bg-gray-800/50 [&_.ant-table-container]:border-gray-200 [&_.ant-table-container]:dark:border-gray-700"
              />
            </Spin>
          </div>
        </div>
      </ComponentCard>

      {/* View Event Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} className="max-w-[1200px] m-4">
        <div className="relative w-full max-w-[1200px] rounded-3xl bg-white dark:bg-gray-900 flex flex-col max-h-[90vh]">
          {selectedEvent && (
            <>
              {/* Header */}
              <div className="px-4 py-4 pr-14 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                <h4 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                  Event Details
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  View detailed information about this event.
                </p>
              </div>

              {/* Content - Scrollable */}
              <div className="px-4 py-3 overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-4">
                  {/* Profile Header - Compact */}
                  <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    {selectedEvent.multimedia && selectedEvent.multimedia.length > 0 ? (
                      <img
                        src={selectedEvent.multimedia[0]}
                        alt={selectedEvent.title}
                        className="w-16 h-16 rounded-lg object-cover border-2 border-gray-300 dark:border-gray-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/user/user-01.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                        <span className="text-xs text-gray-500 dark:text-gray-400">No Image</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-0.5 truncate">
                        {selectedEvent.title}
                      </h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">
                        {selectedEvent.organizer?.username || 'N/A'}
                      </p>
                      <div className="mt-1">{getStatusBadge(selectedEvent.status)}</div>
                    </div>
                  </div>

                  {/* Event Information - Three Column Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Basic Information */}
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Description</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5 line-clamp-3">
                        {selectedEvent.description || 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Location</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5 truncate">
                        {selectedEvent.location && isValidUrl(selectedEvent.location) ? (
                          <a
                            href={formatUrl(selectedEvent.location)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {shortenUrl(formatUrl(selectedEvent.location), 30)}
                          </a>
                        ) : (
                          selectedEvent.location || 'N/A'
                        )}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Category</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedEvent.categories?.name || 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Type</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedEvent.type || 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Level</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedEvent.level || 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Price</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        ${selectedEvent.price?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    {selectedEvent.priceDiscount && (
                      <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <Label className="text-xs mb-1">Discount Price</Label>
                        <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                          ${selectedEvent.priceDiscount.toFixed(2)}
                        </p>
                      </div>
                    )}
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Participants</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedEvent.bookedParticipants?.length || 0} / {selectedEvent.maxParticipants || 0}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Views</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedEvent.views || 0}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Likes</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedEvent.numberOfLikes || 0}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Rating</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedEvent.rating?.toFixed(1) || '0.0'} ({selectedEvent.ratingCount || 0} reviews)
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Start Date</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {formatDateTime(selectedEvent.startDate)}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">End Date</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {formatDateTime(selectedEvent.endDate)}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Organizer</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5 truncate">
                        {selectedEvent.organizer?.username || 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Organizer Email</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5 break-all">
                        {selectedEvent.organizer?.email || 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Created</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {formatDateTime(selectedEvent.createdAt)}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Updated</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {formatDateTime(selectedEvent.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Additional Information */}
                  {(selectedEvent.itinerary?.length || selectedEvent.transportation || selectedEvent.weatherCondition || selectedEvent.meetingPlace || selectedEvent.meetingTime || selectedEvent.announcement) && (
                    <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Additional Information</h4>
                      {selectedEvent.itinerary && selectedEvent.itinerary.length > 0 && (
                        <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <Label className="text-xs mb-1">Itinerary</Label>
                          <ul className="text-sm text-gray-800 dark:text-white/90 mt-0.5 list-disc list-inside space-y-1">
                            {selectedEvent.itinerary.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedEvent.transportation && (
                        <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <Label className="text-xs mb-1">Transportation</Label>
                          <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                            {selectedEvent.transportation}
                          </p>
                        </div>
                      )}
                      {selectedEvent.weatherCondition && (
                        <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <Label className="text-xs mb-1">Weather Condition</Label>
                          <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                            {selectedEvent.weatherCondition}
                          </p>
                        </div>
                      )}
                      {selectedEvent.meetingPlace && (
                        <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <Label className="text-xs mb-1">Meeting Place</Label>
                          <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                            {selectedEvent.meetingPlace}
                          </p>
                        </div>
                      )}
                      {selectedEvent.meetingTime && (
                        <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <Label className="text-xs mb-1">Meeting Time</Label>
                          <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                            {selectedEvent.meetingTime}
                          </p>
                        </div>
                      )}
                      {selectedEvent.announcement && (
                        <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <Label className="text-xs mb-1">Announcement</Label>
                          <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                            {selectedEvent.announcement}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-end">
                  <ButtonComponent onClick={() => setViewModalOpen(false)}>Close</ButtonComponent>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Manage Event Modal */}
      <Modal isOpen={manageModalOpen} onClose={() => setManageModalOpen(false)} className="max-w-[600px] m-4">
        <div className="relative w-full max-w-[600px] rounded-3xl bg-white dark:bg-gray-900 flex flex-col max-h-[90vh]">
          {selectedEvent && (
            <>
              {/* Header */}
              <div className="px-4 py-4 pr-14 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                <h4 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                  Manage Event Status
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Update status for {selectedEvent.title}
                </p>
              </div>

              {/* Content - Scrollable */}
              <div className="px-4 py-4 overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-4">
                  {/* Event Info */}
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <Label className="text-xs mb-1">Event Title</Label>
                    <p className="text-sm text-gray-800 dark:text-white/90 mt-1 truncate">{selectedEvent.title}</p>
                  </div>

                  {/* Current Status */}
                  <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <Label className="text-xs mb-1">Current Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedEvent.status)}</div>
                  </div>

                  {/* New Status */}
                  <div>
                    <Label className="text-sm font-semibold">New Status *</Label>
                    <Select
                      value={newStatus || undefined}
                      onChange={(value) => setNewStatus(value)}
                      className="w-full mt-2"
                      size="large"
                      placeholder="Select status"
                      getPopupContainer={(trigger) => trigger.parentElement || document.body}
                      dropdownStyle={{ zIndex: 1050 }}
                    >
                      <Option value="Pending">Pending</Option>
                      <Option value="Approved">Approved</Option>
                      <Option value="Rejected">Rejected</Option>
                    </Select>
                  </div>

                  {/* Reason */}
                  <div>
                    <Label className="text-sm font-semibold">Reason (Optional)</Label>
                    <Input.TextArea
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="Enter reason for status change..."
                      rows={4}
                      className="mt-2"
                      size="large"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-4 flex-shrink-0 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-end gap-2">
                  <ButtonComponent
                    variant="outline"
                    onClick={() => setManageModalOpen(false)}
                    disabled={actionLoading}
                  >
                    Cancel
                  </ButtonComponent>
                  <ButtonComponent
                    onClick={handleSaveChanges}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </ButtonComponent>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

