import { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../utils/axiosInstance";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Spin, message, Modal, Tag, Button, Input, Badge, Pagination, Select } from "antd";
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  CloseCircleOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckOutlined,
  ReloadOutlined,
  DollarOutlined
} from "@ant-design/icons";
// Date formatting helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface Payment {
  _id: string;
  user: {
    _id: string;
    firstname: string;
    lastname: string;
    email?: string;
    username?: string;
  };
  event: {
    _id: string;
    title: string;
    price: number;
  };
  paymentCode: string;
  orderCode: string;
  amount: number;
  status: 'pending' | 'verified' | 'expired';
  expiresAt: string;
  createdAt: string;
}

interface Event {
  _id: string;
  title: string;
  price: number;
  maxParticipants: number;
  bookedParticipants: string[];
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PaymentResponse {
  data: Payment[];
  pagination: PaginationInfo;
}

interface PaymentCounts {
  all: number;
  pending: number;
  verified: number;
  expired: number;
}

export default function ManageParticipants() {
  const [events, setEvents] = useState<Event[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [paymentDetailModal, setPaymentDetailModal] = useState<{
    visible: boolean;
    payment: Payment | null;
  }>({ visible: false, payment: null });
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  
  // Payment counts by status (for badges and summary cards)
  const [paymentCounts, setPaymentCounts] = useState<PaymentCounts>({
    all: 0,
    pending: 0,
    verified: 0,
    expired: 0,
  });
  
  // Filter state
  const [activeTab, setActiveTab] = useState<string>("all");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch events with pagination
  const fetchEvents = async () => {
    try {
      const response = await axiosInstance.get<{ data: Event[]; pagination?: PaginationInfo }>(
        `event/organizer/all?page=1&limit=100&sortBy=createdAt&sortOrder=desc`
      );
      const eventData = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setEvents(eventData);
      if (eventData.length > 0 && !selectedEventId) {
        setSelectedEventId(eventData[0]._id);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      message.error("Failed to load events");
    }
  };

  // Fetch payment counts by status for summary cards
  const fetchPaymentCounts = useCallback(async () => {
    if (!selectedEventId) return;
    
    try {
      const response = await axiosInstance.get<PaymentCounts>(
        `payment/event/${selectedEventId}/counts`
      );
      setPaymentCounts(response.data || { all: 0, pending: 0, verified: 0, expired: 0 });
    } catch (error) {
      console.error("Error fetching payment counts:", error);
      // Don't show error, just reset counts
      setPaymentCounts({ all: 0, pending: 0, verified: 0, expired: 0 });
    }
  }, [selectedEventId]);

  // Fetch payments with pagination and filters
  const fetchPayments = useCallback(async () => {
    if (!selectedEventId) return;
    
    try {
      setLoading(true);
      
      // Determine status filter based on active tab
      const status = activeTab !== "all" ? activeTab : "";
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy: "createdAt",
        sortOrder: "desc",
        ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
        ...(status && { status }),
      });

      const response = await axiosInstance.get<PaymentResponse>(
        `payment/event/${selectedEventId}?${params.toString()}`
      );
      
      const paymentData = response.data?.data || [];
      const paginationData = response.data?.pagination || pagination;
      
      setPayments(paymentData);
      setPagination(paginationData);
    } catch (error) {
      console.error("Error fetching payments:", error);
      message.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, currentPage, pageSize, debouncedSearchQuery, activeTab]);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchPayments();
    }
  }, [selectedEventId, currentPage, pageSize, debouncedSearchQuery, activeTab, fetchPayments]);

  // Fetch counts separately - only when event changes or after verification
  useEffect(() => {
    if (selectedEventId) {
      fetchPaymentCounts();
    }
  }, [selectedEventId, fetchPaymentCounts]);

  // Get selected event
  const selectedEvent = events.find((e) => e._id === selectedEventId);

  // No client-side filtering needed - server handles it
  // Just use payments directly from the server response

  // Verify payment
  const handleVerifyPayment = async (paymentCode: string) => {
    setVerifying(paymentCode);
    try {
      const response = await axiosInstance.post("payment/verify", {
        paymentCode,
      });

      if (response.data.status === 1 || response.status === 200) {
        message.success("Payment verified successfully!");
        fetchPayments(); // Refresh payments
        fetchPaymentCounts(); // Refresh counts
      } else {
        message.error(response.data.message || "Failed to verify payment");
      }
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      message.error(
        error.response?.data?.message || "Failed to verify payment"
      );
    } finally {
      setVerifying(null);
    }
  };

  // Handle pagination change
  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) {
      setPageSize(pageSize);
    }
  };

  // Handle tab change
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setCurrentPage(1); // Reset to first page on tab change
  };

  // View payment details
  const handleViewPaymentDetails = async (payment: Payment) => {
    try {
      // Fetch full payment details
      const response = await axiosInstance.get(`payment/${payment._id}`);
      setPaymentDetailModal({ visible: true, payment: response.data });
    } catch (error) {
      console.error("Error fetching payment details:", error);
      message.error("Failed to load payment details");
    }
  };

  // Get status color and icon
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "verified":
        return {
          color: "success",
          icon: <CheckCircleOutlined />,
          text: "Confirmed",
        };
      case "pending":
        return {
          color: "processing",
          icon: <ClockCircleOutlined />,
          text: "Pending",
        };
      case "expired":
        return {
          color: "error",
          icon: <CloseCircleOutlined />,
          text: "Expired",
        };
      default:
        return {
          color: "default",
          icon: null,
          text: status,
        };
    }
  };

  // Check if payment is expired
  const isPaymentExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  // Render payment card
  const renderPaymentCard = (payment: Payment, showVerify: boolean = false) => {
    const statusConfig = getStatusConfig(payment.status);
    const expired = isPaymentExpired(payment.expiresAt);
    
    return (
      <div
        key={payment._id}
        className="p-4 mb-4 border border-gray-200 rounded-lg bg-white dark:border-gray-700 dark:bg-gray-800 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Tag
                icon={statusConfig.icon}
                color={statusConfig.color}
                className="text-sm"
              >
                {statusConfig.text}
              </Tag>
              {expired && payment.status === "pending" && (
                <Badge status="error" text="Expired" />
              )}
            </div>

            <div className="space-y-1 mb-3">
              <p className="text-sm font-semibold text-gray-800 dark:text-white">
                {payment.user?.firstname} {payment.user?.lastname}
              </p>
              {payment.user?.email && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {payment.user.email}
                </p>
              )}
              {payment.user?.username && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  @{payment.user.username}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Payment Code:</span>
                <p className="font-mono text-gray-800 dark:text-white">
                  {payment.paymentCode}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Order Code:</span>
                <p className="font-mono text-gray-800 dark:text-white">
                  {payment.orderCode}
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                <p className="font-semibold text-gray-800 dark:text-white">
                  {payment.amount || payment.event?.price || 0} ETB
                </p>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Expires:</span>
                <p className="text-gray-800 dark:text-white">
                  {formatDate(payment.expiresAt)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-4">
            <Button
              type="default"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewPaymentDetails(payment)}
            >
              Details
            </Button>
            {showVerify && payment.status === "pending" && !expired && (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                size="small"
                loading={verifying === payment.paymentCode}
                onClick={() => handleVerifyPayment(payment.paymentCode)}
              >
                Verify
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <PageMeta title="HikeHub | Manage Participants" description="" />
      <PageBreadcrumb pageTitle="Manage Participants" />
      
      <div className="space-y-6">
        <ComponentCard title="">
          {/* Event Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an event...</option>
              {events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.title} ({event.bookedParticipants?.length || 0}/{event.maxParticipants})
                </option>
              ))}
            </select>
          </div>

          {selectedEvent && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                {selectedEvent.title}
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Price:</span>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {selectedEvent.price} ETB
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Reservations:</span>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {paymentCounts.pending}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Confirmed:</span>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {paymentCounts.verified}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search by name, email, payment code, or order code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
              allowClear
            />
          </div>

          {/* Main Content Area with Sidebar */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="flex-1 order-2 lg:order-1">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Spin size="large" />
                </div>
              ) : (
                <>
                  <div className="mt-4">
                    {payments.length === 0 ? (
                      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                        {activeTab === "all" && "No payments found"}
                        {activeTab === "pending" && "No pending payments"}
                        {activeTab === "verified" && "No confirmed bookings"}
                        {activeTab === "expired" && "No expired payments"}
                      </div>
                    ) : (
                      payments.map((payment) =>
                        renderPaymentCard(payment, activeTab === "all" || activeTab === "pending")
                      )
                    )}
                  </div>

                  {/* Pagination */}
                  {pagination.totalItems > 0 && (
                    <div className="mt-6 flex justify-between items-center">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.totalItems)} of {pagination.totalItems} payments
                      </div>
                      <Pagination
                        current={currentPage}
                        total={pagination.totalItems}
                        pageSize={pageSize}
                        showSizeChanger
                        showQuickJumper
                        pageSizeOptions={['10', '20', '50', '100']}
                        onChange={handlePageChange}
                        onShowSizeChange={handlePageChange}
                        showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} items`}
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="w-full lg:w-64 flex-shrink-0 order-1 lg:order-2">
              <div className="lg:sticky lg:top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wide">
                  Filter by Status
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => handleTabChange("all")}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === "all"
                        ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300"
                        : "bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <DollarOutlined className="text-base" />
                      <span className="font-medium">All Payments</span>
                    </div>
                    <Badge 
                      count={paymentCounts.all} 
                      className="ml-2"
                      style={{
                        backgroundColor: activeTab === "all" ? '#3b82f6' : '#6b7280'
                      }}
                    />
                  </button>

                  <button
                    onClick={() => handleTabChange("pending")}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === "pending"
                        ? "bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-300"
                        : "bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ClockCircleOutlined className="text-base" />
                      <span className="font-medium">Reservations</span>
                    </div>
                    <Badge 
                      count={paymentCounts.pending} 
                      className="ml-2"
                      style={{
                        backgroundColor: activeTab === "pending" ? '#3b82f6' : '#6b7280'
                      }}
                    />
                  </button>

                  <button
                    onClick={() => handleTabChange("verified")}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === "verified"
                        ? "bg-green-50 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-400 text-green-700 dark:text-green-300"
                        : "bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircleOutlined className="text-base" />
                      <span className="font-medium">Confirmed</span>
                    </div>
                    <Badge 
                      count={paymentCounts.verified} 
                      className="ml-2"
                      style={{
                        backgroundColor: activeTab === "verified" ? '#10b981' : '#6b7280'
                      }}
                    />
                  </button>

                  <button
                    onClick={() => handleTabChange("expired")}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      activeTab === "expired"
                        ? "bg-red-50 dark:bg-red-900/30 border-2 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300"
                        : "bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CloseCircleOutlined className="text-base" />
                      <span className="font-medium">Expired</span>
                    </div>
                    <Badge 
                      count={paymentCounts.expired} 
                      className="ml-2"
                      style={{
                        backgroundColor: activeTab === "expired" ? '#ef4444' : '#6b7280'
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Refresh Button */}
          <div className="mt-6 flex justify-end">
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchPayments();
                fetchPaymentCounts();
              }}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        </ComponentCard>
      </div>

      {/* Payment Detail Modal */}
      <Modal
        title="Payment Details"
        open={paymentDetailModal.visible}
        onCancel={() =>
          setPaymentDetailModal({ visible: false, payment: null })
        }
        footer={null}
        width={600}
      >
        {paymentDetailModal.payment && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">User</p>
                <p className="font-semibold text-gray-800 dark:text-white">
                  {paymentDetailModal.payment.user?.firstname}{" "}
                  {paymentDetailModal.payment.user?.lastname}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <Tag
                  {...getStatusConfig(paymentDetailModal.payment.status)}
                >
                  {getStatusConfig(paymentDetailModal.payment.status).text}
                </Tag>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Payment Code</p>
                <p className="font-mono text-gray-800 dark:text-white">
                  {paymentDetailModal.payment.paymentCode}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Order Code</p>
                <p className="font-mono text-gray-800 dark:text-white">
                  {paymentDetailModal.payment.orderCode}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                <p className="font-semibold text-lg text-gray-800 dark:text-white">
                  {paymentDetailModal.payment.amount || paymentDetailModal.payment.event?.price || 0} ETB
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
                <p className="text-gray-800 dark:text-white">
                  {formatDate(paymentDetailModal.payment.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Expires At</p>
                <p className="text-gray-800 dark:text-white">
                  {formatDate(paymentDetailModal.payment.expiresAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Event</p>
                <p className="text-gray-800 dark:text-white">
                  {paymentDetailModal.payment.event?.title || "N/A"}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

