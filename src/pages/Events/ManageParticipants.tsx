import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Spin, message, Modal, Tag, Button, Tabs, Input, Badge } from "antd";
import { 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  CloseCircleOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckOutlined,
  ReloadOutlined
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

const { TabPane } = Tabs;

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

export default function ManageParticipants() {
  const [events, setEvents] = useState<Event[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [paymentDetailModal, setPaymentDetailModal] = useState<{
    visible: boolean;
    payment: Payment | null;
  }>({ visible: false, payment: null });

  // Fetch events
  const fetchEvents = async () => {
    try {
      const response = await axiosInstance.get<Event[]>("event/organizer/all");
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

  // Fetch payments
  const fetchPayments = async () => {
    if (!selectedEventId) return;
    
    try {
      setLoading(true);
      // Fetch all payments first, then filter by event
      const response = await axiosInstance.get<Payment[]>("payment/all");
      const allPayments = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      
      // Filter payments for selected event and populate user/event data
      const eventPayments = allPayments.filter(
        (payment: any) => payment.event?._id === selectedEventId || payment.event === selectedEventId
      );
      
      // Fetch detailed payment info if needed
      const detailedPayments = await Promise.all(
        eventPayments.map(async (payment: any) => {
          try {
            const detailResponse = await axiosInstance.get(`payment/${payment._id}`);
            return detailResponse.data;
          } catch {
            return payment;
          }
        })
      );
      
      setPayments(detailedPayments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      message.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchPayments();
    }
  }, [selectedEventId]);

  // Get selected event
  const selectedEvent = events.find((e) => e._id === selectedEventId);

  // Filter payments based on status and search
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.user?.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.user?.lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.paymentCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.orderCode?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const pendingPayments = filteredPayments.filter((p) => p.status === "pending");
  const verifiedPayments = filteredPayments.filter((p) => p.status === "verified");
  const expiredPayments = filteredPayments.filter((p) => p.status === "expired");

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
                  ${payment.amount || payment.event?.price || 0}
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
                    ${selectedEvent.price}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Reservations:</span>
                  <p className="font-semibold text-gray-800 dark:text-white">
                    {pendingPayments.length}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Confirmed:</span>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {verifiedPayments.length}
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

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spin size="large" />
            </div>
          ) : (
            <Tabs defaultActiveKey="all">
              <TabPane
                tab={
                  <span>
                    All Payments
                    <Badge count={filteredPayments.length} style={{ marginLeft: 8 }} />
                  </span>
                }
                key="all"
              >
                <div className="mt-4">
                  {filteredPayments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      No payments found
                    </div>
                  ) : (
                    filteredPayments.map((payment) =>
                      renderPaymentCard(payment, true)
                    )
                  )}
                </div>
              </TabPane>

              <TabPane
                tab={
                  <span>
                    Reservations (Pending)
                    <Badge count={pendingPayments.length} style={{ marginLeft: 8 }} />
                  </span>
                }
                key="pending"
              >
                <div className="mt-4">
                  {pendingPayments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      No pending payments
                    </div>
                  ) : (
                    pendingPayments.map((payment) =>
                      renderPaymentCard(payment, true)
                    )
                  )}
                </div>
              </TabPane>

              <TabPane
                tab={
                  <span>
                    Confirmed Bookings
                    <Badge count={verifiedPayments.length} style={{ marginLeft: 8 }} />
                  </span>
                }
                key="verified"
              >
                <div className="mt-4">
                  {verifiedPayments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      No confirmed bookings
                    </div>
                  ) : (
                    verifiedPayments.map((payment) =>
                      renderPaymentCard(payment, false)
                    )
                  )}
                </div>
              </TabPane>

              <TabPane
                tab={
                  <span>
                    Expired
                    <Badge count={expiredPayments.length} style={{ marginLeft: 8 }} />
                  </span>
                }
                key="expired"
              >
                <div className="mt-4">
                  {expiredPayments.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      No expired payments
                    </div>
                  ) : (
                    expiredPayments.map((payment) =>
                      renderPaymentCard(payment, false)
                    )
                  )}
                </div>
              </TabPane>
            </Tabs>
          )}

          {/* Refresh Button */}
          <div className="mt-6 flex justify-end">
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchPayments}
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
                  ${paymentDetailModal.payment.amount || paymentDetailModal.payment.event?.price || 0}
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

