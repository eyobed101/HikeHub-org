import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { getUserRole } from "../../utils/userRole";
import axiosInstance, { ensureValidToken } from "../../utils/axiosInstance";
import { Spin, Input, Select, Table, Badge, Button, Space, message, Popconfirm } from "antd";
import { SearchOutlined, EyeOutlined, EditOutlined } from "@ant-design/icons";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import ButtonComponent from "../../components/ui/Button/Button";

const { Option } = Select;

interface Organizer {
  _id: string;
  organizer: {
    _id: string;
    username: string;
    email: string;
    phone_number?: string;
    city?: string;
    address?: string;
  };
  logo?: string;
  companyName?: string;
  commissionRate: number;
  tinNo?: string;
  RegistrationNumber?: string;
  status: 'Incomplete' | 'Pending' | 'Approved' | 'Rejected';
  totalRevenue: number;
  totalEvents: number;
  activeEvents: number;
  expiredEvents: number;
  totalParticipants: number;
  rating: number;
  ratingCount: number;
  companyDescription?: string;
  createdAt: string;
  updatedAt: string;
  lastUpdated: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function OrganizerManagement() {
  const navigate = useNavigate();
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
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

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState<Organizer | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusReason, setStatusReason] = useState<string>("");
  const [newCommissionRate, setNewCommissionRate] = useState<string>("");
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

  // Fetch organizers
  const fetchOrganizers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        sortBy: "createdAt",
        sortOrder: "desc",
        ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await axiosInstance.get(`superadmin/organizers?${params.toString()}`);
      
      if (response.data.status === 1) {
        setOrganizers(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination,
        }));
      } else {
        message.error(response.data.message || "Failed to fetch organizers");
      }
    } catch (error: any) {
      console.error("Error fetching organizers:", error);
      message.error(error.response?.data?.message || "Failed to fetch organizers");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage, debouncedSearchQuery, statusFilter]);

  useEffect(() => {
    fetchOrganizers();
  }, [fetchOrganizers]);

  // Handle view organizer details
  const handleViewOrganizer = (organizer: Organizer) => {
    setSelectedOrganizer(organizer);
    setViewModalOpen(true);
  };

  // Handle manage organizer (status and commission)
  const handleManageOrganizer = (organizer: Organizer) => {
    setSelectedOrganizer(organizer);
    setNewStatus(organizer.status);
    setStatusReason("");
    // Handle commissionRate - use default 5 if undefined/null, or convert to string
    const commissionRate = organizer.commissionRate !== undefined && organizer.commissionRate !== null 
      ? organizer.commissionRate 
      : 5; // Default commission rate
    setNewCommissionRate(commissionRate.toString());
    setManageModalOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedOrganizer || !selectedOrganizer.organizer || !selectedOrganizer.organizer._id) {
      message.error("Invalid organizer data. Please try again.");
      return;
    }

    const organizerId = selectedOrganizer.organizer._id;

    // Validate and check commission rate change
    if (!newCommissionRate || newCommissionRate.trim() === '') {
      message.warning("Please enter a commission rate");
      return;
    }

    const rate = parseFloat(newCommissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      message.error("Commission rate must be a number between 0 and 100");
      return;
    }

    const currentCommissionRate = selectedOrganizer.commissionRate !== undefined && selectedOrganizer.commissionRate !== null 
      ? selectedOrganizer.commissionRate 
      : 5; // Default if not set
    const hasCommissionChange = rate !== currentCommissionRate;

    // Check if status changed
    const hasStatusChange = newStatus && newStatus !== selectedOrganizer.status;

    // If nothing changed, show warning
    if (!hasStatusChange && !hasCommissionChange) {
      message.warning("No changes detected. Please modify at least one field.");
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

      const results = [];
      const changes = [];

      // Update status if changed (execute first)
      if (hasStatusChange) {
        try {
          const statusResponse = await axiosInstance.put(`superadmin/organizers/${organizerId}/status`, {
            status: newStatus,
            reason: statusReason || undefined,
          });
          if (statusResponse.data.status === 1) {
            results.push(statusResponse);
            changes.push(`status to ${newStatus}`);
          } else {
            throw new Error(statusResponse.data.message || "Status update failed");
          }
        } catch (error: any) {
          console.error("Error updating status:", error);
          // If it's a 401, the session might have expired during the request
          if (error.response?.status === 401 || error.message?.includes("Session expired")) {
            message.error("Your session has expired. Please log in again.");
            return;
          }
          throw new Error(error.response?.data?.message || "Failed to update status");
        }
      }

      // Small delay to ensure token refresh completes if it happened
      if (hasStatusChange && hasCommissionChange) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update commission rate if changed (execute after status update)
      if (hasCommissionChange) {
        try {
          // Check token again before second request
          const tokenBeforeRequest = await ensureValidToken();
          if (!tokenBeforeRequest) {
            message.error("Your session has expired. Please log in again.");
            return;
          }

          const commissionResponse = await axiosInstance.put(`superadmin/organizers/${organizerId}/commission`, {
            commissionRate: rate,
          });
          if (commissionResponse.data.status === 1) {
            results.push(commissionResponse);
            changes.push(`commission rate to ${newCommissionRate}%`);
          } else {
            throw new Error(commissionResponse.data.message || "Commission rate update failed");
          }
        } catch (error: any) {
          console.error("Error updating commission rate:", error);
          // If it's a 401, the session might have expired during the request
          if (error.response?.status === 401 || error.message?.includes("Session expired")) {
            message.error("Your session has expired. Please log in again.");
            return;
          }
          throw new Error(error.response?.data?.message || "Failed to update commission rate");
        }
      }
      
      // If we get here, all updates were successful
      if (results.length > 0) {
        message.success(`Organizer updated successfully: ${changes.join(', ')}`);
        setManageModalOpen(false);
        fetchOrganizers();
      }
    } catch (error: any) {
      console.error("Error updating organizer:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to update organizer";
      // Don't show error if it's already a session expired message
      if (!errorMessage.includes("session") && !errorMessage.includes("Session")) {
        message.error(errorMessage);
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircleOutlined className="text-green-600 dark:text-green-400" />;
      case 'Rejected':
        return <CloseCircleOutlined className="text-red-600 dark:text-red-400" />;
      case 'Pending':
        return <ClockCircleOutlined className="text-orange-600 dark:text-orange-400" />;
      default:
        return <ClockCircleOutlined className="text-gray-600 dark:text-gray-400" />;
    }
  };

  // Table columns
  const columns = [
    {
      title: <span className="font-semibold text-gray-700 dark:text-gray-300">Organizer</span>,
      key: 'organizer',
      render: (record: Organizer) => {
        if (!record.organizer) {
          return <span className="text-gray-500 dark:text-gray-400">N/A</span>;
        }
        return (
          <div className="flex items-center gap-3">
            {record.logo ? (
              <img
                src={record.logo}
                alt={record.companyName || record.organizer?.username || 'Organizer'}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 font-semibold">
                  {(record.companyName || record.organizer?.username || 'O').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-200">
                {record.companyName || record.organizer?.username || 'Unknown'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {record.organizer?.email || 'N/A'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      title: <span className="font-semibold text-gray-700 dark:text-gray-300">Status</span>,
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          'Approved': 'success',
          'Pending': 'warning',
          'Rejected': 'error',
          'Incomplete': 'default',
        };
        return (
          <Badge
            status={colorMap[status] as any || 'default'}
            text={
              <span className="text-sm capitalize text-gray-800 dark:text-gray-200">
                {status}
              </span>
            }
          />
        );
      },
    },
    {
      title: <span className="font-semibold text-gray-700 dark:text-gray-300">Commission</span>,
      dataIndex: 'commissionRate',
      key: 'commissionRate',
      render: (rate: number) => (
        <span className="text-gray-800 dark:text-gray-200 font-medium">
          {rate}%
        </span>
      ),
    },
    {
      title: <span className="font-semibold text-gray-700 dark:text-gray-300">Events</span>,
      key: 'events',
      render: (record: Organizer) => (
        <div className="text-sm">
          <div className="text-gray-800 dark:text-gray-200 font-medium">
            Total: {record.totalEvents}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            Active: {record.activeEvents}
          </div>
        </div>
      ),
    },
    {
      title: <span className="font-semibold text-gray-700 dark:text-gray-300">Revenue</span>,
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      render: (revenue: number) => (
        <span className="text-gray-800 dark:text-gray-200 font-semibold">
          {revenue.toLocaleString()} ETB
        </span>
      ),
    },
    {
      title: <span className="font-semibold text-gray-700 dark:text-gray-300">Rating</span>,
      key: 'rating',
      render: (record: Organizer) => (
        <div className="text-sm">
          <div className="text-gray-800 dark:text-gray-200 font-medium">
            {record.rating > 0 ? record.rating.toFixed(1) : 'N/A'}
          </div>
          {record.ratingCount > 0 && (
            <div className="text-gray-500 dark:text-gray-400">
              ({record.ratingCount} reviews)
            </div>
          )}
        </div>
      ),
    },
    {
      title: <span className="font-semibold text-gray-700 dark:text-gray-300">Created</span>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => {
        if (!date) return <span className="text-gray-500 dark:text-gray-400 text-sm">N/A</span>;
        try {
          const dateObj = new Date(date);
          if (isNaN(dateObj.getTime())) {
            return <span className="text-gray-500 dark:text-gray-400 text-sm">N/A</span>;
          }
          return (
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              {dateObj.toLocaleDateString()}
            </span>
          );
        } catch (error) {
          return <span className="text-gray-500 dark:text-gray-400 text-sm">N/A</span>;
        }
      },
    },
    {
      title: <span className="font-semibold text-gray-700 dark:text-gray-300">Actions</span>,
      key: 'actions',
      render: (record: Organizer) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewOrganizer(record)}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleManageOrganizer(record)}
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
          >
            Manage
          </Button>
        </Space>
      ),
    },
  ];

  if (loading && organizers.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <PageMeta title="HikeHub | Organizer Management" description="Superadmin organizer management" />
      <PageBreadcrumb pageTitle="Organizer Management" />

      <ComponentCard>
        <div className="p-6">
          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search by username or email..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              size="large"
            />
            <Select
              placeholder="Filter by Status"
              value={statusFilter || undefined}
              onChange={(value) => {
                setStatusFilter(value || "");
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value="Incomplete">Incomplete</Option>
              <Option value="Pending">Pending</Option>
              <Option value="Approved">Approved</Option>
              <Option value="Rejected">Rejected</Option>
            </Select>
          </div>

          {/* Organizers Table */}
          <Table
            columns={columns}
            dataSource={organizers}
            rowKey="_id"
            loading={loading}
            pagination={{
              current: pagination.currentPage,
              pageSize: pagination.itemsPerPage,
              total: pagination.totalItems,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ['10', '20', '30', '50', '100'],
              onChange: (page, pageSize) => {
                setPagination(prev => ({
                  ...prev,
                  currentPage: page,
                  itemsPerPage: pageSize || 30,
                }));
              },
              onShowSizeChange: (current, size) => {
                setPagination(prev => ({
                  ...prev,
                  currentPage: 1,
                  itemsPerPage: size,
                }));
              },
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} organizers`,
            }}
            scroll={{ x: 'max-content' }}
            className="[&_.ant-table-wrapper]:bg-transparent [&_.ant-table]:bg-white [&_.ant-table]:dark:bg-gray-900 [&_.ant-table-container]:bg-white [&_.ant-table-container]:dark:bg-gray-900 [&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:dark:bg-gray-800 [&_.ant-table-thead>tr>th]:px-4 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-gray-700 [&_.ant-table-thead>tr>th]:dark:text-gray-300 [&_.ant-table-tbody>tr>td]:px-4 [&_.ant-table-tbody>tr>td]:py-3 [&_.ant-table-tbody>tr>td]:text-gray-800 [&_.ant-table-tbody>tr>td]:dark:text-gray-200 [&_.ant-table-tbody>tr]:bg-white [&_.ant-table-tbody>tr]:dark:bg-gray-900 [&_.ant-table-tbody>tr:hover]:bg-gray-50 [&_.ant-table-tbody>tr:hover]:dark:bg-gray-800/50 [&_.ant-table]:text-sm [&_.ant-table-container]:border-gray-200 [&_.ant-table-container]:dark:border-gray-700"
          />
        </div>
      </ComponentCard>

      {/* View Organizer Details Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} className="max-w-[1200px] m-4">
        <div className="relative w-full max-w-[1200px] rounded-3xl bg-white dark:bg-gray-900 flex flex-col max-h-[90vh]">
          {selectedOrganizer && (
            <>
              <div className="px-4 py-4 pr-14 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                <h4 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                  Organizer Details
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  View detailed information about this organizer.
                </p>
              </div>
              <div className="px-4 py-3 overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-4">
                  {/* Profile Header - Compact */}
                  <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    {selectedOrganizer.logo ? (
                      <img
                        src={selectedOrganizer.logo}
                        alt={selectedOrganizer.companyName || selectedOrganizer.organizer?.username || 'Organizer'}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                        <span className="text-2xl text-gray-500 dark:text-gray-400 font-semibold">
                          {(selectedOrganizer.companyName || selectedOrganizer.organizer?.username || 'O').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-0.5 truncate">
                        {selectedOrganizer.companyName || selectedOrganizer.organizer?.username || 'Unknown Organizer'}
                      </h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 truncate">
                        {selectedOrganizer.organizer?.email || 'N/A'}
                      </p>
                      <Badge
                        status={
                          selectedOrganizer.status === 'Approved'
                            ? 'success'
                            : selectedOrganizer.status === 'Pending'
                            ? 'warning'
                            : selectedOrganizer.status === 'Rejected'
                            ? 'error'
                            : 'default'
                        }
                        text={
                          <span className="text-xs capitalize text-gray-800 dark:text-gray-200">
                            {selectedOrganizer.status}
                          </span>
                        }
                      />
                    </div>
                  </div>

                  {/* Organizer Information - Three Column Layout for better space usage */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Company Name</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5 truncate">
                        {selectedOrganizer.companyName || 'Not provided'}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Username</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5 truncate">
                        {selectedOrganizer.organizer?.username || 'Not provided'}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Email</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5 break-all">
                        {selectedOrganizer.organizer?.email || 'Not provided'}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Phone</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedOrganizer.organizer?.phone_number || 'Not provided'}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">City</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedOrganizer.organizer?.city || 'Not provided'}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Address</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5 truncate">
                        {selectedOrganizer.organizer?.address || 'Not provided'}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Status</Label>
                      <div className="mt-0.5">
                        <Badge
                          status={
                            selectedOrganizer.status === 'Approved'
                              ? 'success'
                              : selectedOrganizer.status === 'Pending'
                              ? 'warning'
                              : selectedOrganizer.status === 'Rejected'
                              ? 'error'
                              : 'default'
                          }
                          text={
                            <span className="text-xs capitalize text-gray-800 dark:text-gray-200">
                              {selectedOrganizer.status}
                            </span>
                          }
                        />
                      </div>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Commission</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5 font-semibold">
                        {selectedOrganizer.commissionRate}%
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">TIN Number</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedOrganizer.tinNo || 'Not provided'}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Reg. Number</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedOrganizer.RegistrationNumber || 'Not provided'}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Revenue</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5 font-semibold">
                        {selectedOrganizer.totalRevenue.toLocaleString()} ETB
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Total Events</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedOrganizer.totalEvents}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Active Events</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedOrganizer.activeEvents}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Expired Events</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedOrganizer.expiredEvents}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Participants</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedOrganizer.totalParticipants}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Rating</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedOrganizer.rating > 0 
                          ? `${selectedOrganizer.rating.toFixed(1)} (${selectedOrganizer.ratingCount})`
                          : 'N/A'}
                      </p>
                    </div>
                    {selectedOrganizer.companyDescription && (
                      <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg md:col-span-3">
                        <Label className="text-xs mb-1">Description</Label>
                        <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5 line-clamp-3">
                          {selectedOrganizer.companyDescription}
                        </p>
                      </div>
                    )}
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Created</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedOrganizer.createdAt 
                          ? (() => {
                              try {
                                const date = new Date(selectedOrganizer.createdAt);
                                return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                              } catch {
                                return 'N/A';
                              }
                            })()
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <Label className="text-xs mb-1">Updated</Label>
                      <p className="text-sm text-gray-800 dark:text-white/90 mt-0.5">
                        {selectedOrganizer.lastUpdated || selectedOrganizer.updatedAt
                          ? (() => {
                              try {
                                const date = new Date(selectedOrganizer.lastUpdated || selectedOrganizer.updatedAt);
                                return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                              } catch {
                                return 'N/A';
                              }
                            })()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <ButtonComponent size="sm" variant="outline" onClick={() => setViewModalOpen(false)}>
                  Close
                </ButtonComponent>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Manage Organizer Modal - Status and Commission */}
      <Modal isOpen={manageModalOpen} onClose={() => setManageModalOpen(false)} className="max-w-[600px] m-4">
        <div className="relative w-full max-w-[600px] rounded-3xl bg-white dark:bg-gray-900 flex flex-col max-h-[90vh]">
          {selectedOrganizer && (
            <>
              <div className="px-4 py-4 pr-14 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                <h4 className="mb-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                  Manage Organizer
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Update status and commission rate for {selectedOrganizer.companyName || selectedOrganizer.organizer?.username || 'this organizer'}
                </p>
              </div>
              <div className="px-4 py-4 overflow-y-auto custom-scrollbar flex-1">
                {/* Status Section */}
                <div className="mb-6">
                  <Label className="text-base font-semibold mb-3">Status Management</Label>
                  <div className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <Label className="text-xs mb-1">Current Status</Label>
                    <div className="mt-1">
                      <Badge
                        status={
                          selectedOrganizer.status === 'Approved'
                            ? 'success'
                            : selectedOrganizer.status === 'Pending'
                            ? 'warning'
                            : selectedOrganizer.status === 'Rejected'
                            ? 'error'
                            : 'default'
                        }
                        text={
                          <span className="text-sm capitalize text-gray-800 dark:text-gray-200">
                            {selectedOrganizer.status}
                          </span>
                        }
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <Label>New Status</Label>
                    <Select
                      value={newStatus || undefined}
                      onChange={(value) => setNewStatus(value)}
                      style={{ width: '100%' }}
                      size="large"
                      className="mt-2"
                      placeholder="Select status"
                      getPopupContainer={(trigger) => trigger.parentElement || document.body}
                      dropdownStyle={{ zIndex: 1050 }}
                    >
                      <Option value="Incomplete">Incomplete</Option>
                      <Option value="Pending">Pending</Option>
                      <Option value="Approved">Approved</Option>
                      <Option value="Rejected">Rejected</Option>
                    </Select>
                  </div>
                  <div>
                    <Label>Reason (Optional)</Label>
                    <textarea
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      placeholder="Enter reason for status change..."
                      rows={3}
                      className="w-full mt-2 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-white/90 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:focus:ring-brand-400 resize-none"
                    />
                  </div>
                </div>

                {/* Commission Rate Section */}
                <div className="mb-6">
                  <Label className="text-base font-semibold mb-3">Commission Rate Management</Label>
                  <div className="mb-4 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <Label className="text-xs mb-1">Current Commission Rate</Label>
                    <p className="text-lg font-semibold text-gray-800 dark:text-white/90 mt-1">
                      {selectedOrganizer.commissionRate !== undefined && selectedOrganizer.commissionRate !== null 
                        ? `${selectedOrganizer.commissionRate}%`
                        : 'Not set (default: 5%)'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      This is the percentage the platform takes from each transaction
                    </p>
                  </div>
                  <div>
                    <Label>New Commission Rate (%) <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      value={newCommissionRate}
                      onChange={(e) => setNewCommissionRate(e.target.value)}
                      placeholder="Enter commission rate (0-100)"
                      min="0"
                      max="100"
                      step="0.1"
                      size="large"
                      className="mt-2"
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Enter a value between 0 and 100. For example, 5 means 5% commission.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-4 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                <ButtonComponent
                  size="sm"
                  variant="outline"
                  onClick={() => setManageModalOpen(false)}
                >
                  Cancel
                </ButtonComponent>
                <ButtonComponent
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </ButtonComponent>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

