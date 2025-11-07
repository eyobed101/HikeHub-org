import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { getUserRole } from "../../utils/userRole";
import axiosInstance from "../../utils/axiosInstance";
import { Spin, Input, Select, Table, Badge, Button, Space, message, Popconfirm } from "antd";
import { SearchOutlined, EyeOutlined, EditOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import ButtonComponent from "../../components/ui/Button/Button";

const { Option } = Select;

interface User {
  _id: string;
  username: string;
  email: string;
  firstname?: string;
  lastname?: string;
  role: 'Superadmin' | 'EventOrganizer' | 'Hiker';
  isVerified: boolean;
  isBlocked: boolean;
  profilePicture?: string;
  phone_number?: string;
  createdAt: string;
  updatedAt: string;
  organizerDetails?: {
    companyName?: string;
    status?: string;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
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
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [verificationFilter, setVerificationFilter] = useState<string>("");

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("");
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

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        sortBy: "createdAt",
        sortOrder: "desc",
        ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
        ...(roleFilter && { role: roleFilter }),
        ...(verificationFilter !== "" && { isVerified: verificationFilter }),
      });

      const response = await axiosInstance.get(`superadmin/users?${params.toString()}`);
      
      if (response.data.status === 1) {
        setUsers(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination,
        }));
      } else {
        message.error(response.data.message || "Failed to fetch users");
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
      message.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.itemsPerPage, debouncedSearchQuery, roleFilter, verificationFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle view user details
  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  // Handle update role
  const handleUpdateRole = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setRoleModalOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser || !newRole || newRole === selectedUser.role) {
      message.warning("Please select a different role");
      return;
    }

    try {
      setActionLoading(true);
      const response = await axiosInstance.put(`superadmin/users/${selectedUser._id}/role`, {
        role: newRole,
      });

      if (response.data.status === 1) {
        message.success("User role updated successfully");
        setRoleModalOpen(false);
        fetchUsers();
      } else {
        message.error(response.data.message || "Failed to update role");
      }
    } catch (error: any) {
      console.error("Error updating role:", error);
      message.error(error.response?.data?.message || "Failed to update role");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle block/unblock
  const handleToggleBlock = async (user: User) => {
    try {
      setActionLoading(true);
      const response = await axiosInstance.put(`superadmin/users/${user._id}/block`);

      if (response.data.status === 1) {
        message.success(
          user.isBlocked ? "User unblocked successfully" : "User blocked successfully"
        );
        fetchUsers();
      } else {
        message.error(response.data.message || "Failed to update user status");
      }
    } catch (error: any) {
      console.error("Error toggling block:", error);
      message.error(error.response?.data?.message || "Failed to update user status");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    try {
      setActionLoading(true);
      const response = await axiosInstance.delete(`superadmin/users/${userId}`);

      if (response.data.status === 1) {
        message.success("User deleted successfully");
        fetchUsers();
      } else {
        message.error(response.data.message || "Failed to delete user");
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      message.error(error.response?.data?.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: <span className="font-semibold text-gray-700 dark:text-gray-300">User</span>,
      key: 'user',
      render: (record: User) => (
        <div className="flex items-center gap-3">
          {record.profilePicture ? (
            <img
              src={record.profilePicture}
              alt={record.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <UserOutlined className="text-gray-500 dark:text-gray-400" />
            </div>
          )}
          <div>
            <div className="font-medium text-gray-800 dark:text-gray-200">
              {record.username}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: <span className="font-semibold text-gray-700 dark:text-gray-300">Role</span>,
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colorMap: Record<string, string> = {
          'Superadmin': 'error',
          'EventOrganizer': 'processing',
          'Hiker': 'success',
        };
        return (
          <Badge
            status={colorMap[role] as any || 'default'}
            text={<span className="text-sm capitalize">{role}</span>}
          />
        );
      },
    },
    {
      title: <span className="font-semibold text-gray-700 dark:text-gray-300">Status</span>,
      key: 'status',
      render: (record: User) => (
        <Space direction="vertical" size="small">
          <Badge
            status={record.isVerified ? 'success' : 'warning'}
            text={
              <span className="text-sm">
                {record.isVerified ? 'Verified' : 'Unverified'}
              </span>
            }
          />
          {record.isBlocked && (
            <Badge
              status="error"
              text={<span className="text-sm">Blocked</span>}
            />
          )}
        </Space>
      ),
    },
    {
      title: <span className="font-semibold text-gray-700 dark:text-gray-300">Created</span>,
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <span className="text-gray-600 dark:text-gray-400 text-sm">
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    },
    {
      title: <span className="font-semibold text-gray-700 dark:text-gray-300">Actions</span>,
      key: 'actions',
      render: (record: User) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewUser(record)}
            className="text-blue-600 hover:text-blue-700"
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleUpdateRole(record)}
            className="text-green-600 hover:text-green-700"
            disabled={record.role === 'Superadmin'}
          >
            Role
          </Button>
          <Button
            type="link"
            onClick={() => handleToggleBlock(record)}
            className={record.isBlocked ? "text-green-600 hover:text-green-700" : "text-orange-600 hover:text-orange-700"}
            disabled={actionLoading || record.role === 'Superadmin'}
          >
            {record.isBlocked ? 'Unblock' : 'Block'}
          </Button>
          <Popconfirm
            title="Delete User"
            description={`Are you sure you want to delete ${record.username}? This action cannot be undone.`}
            onConfirm={() => handleDeleteUser(record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
            disabled={record.role === 'Superadmin'}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={record.role === 'Superadmin' || actionLoading}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <PageMeta title="HikeHub | User Management" description="Superadmin user management" />
      <PageBreadcrumb pageTitle="User Management" />

      <ComponentCard>
        <div className="p-6">
          {/* Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Search by username, email, or name..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              size="large"
            />
            <Select
              placeholder="Filter by Role"
              value={roleFilter || undefined}
              onChange={(value) => {
                setRoleFilter(value || "");
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value="Superadmin">Superadmin</Option>
              <Option value="EventOrganizer">Event Organizer</Option>
              <Option value="Hiker">Hiker</Option>
            </Select>
            <Select
              placeholder="Filter by Verification"
              value={verificationFilter || undefined}
              onChange={(value) => {
                setVerificationFilter(value || "");
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
              allowClear
              size="large"
              style={{ width: '100%' }}
            >
              <Option value="true">Verified</Option>
              <Option value="false">Unverified</Option>
            </Select>
          </div>

          {/* Users Table */}
          <Table
            columns={columns}
            dataSource={users}
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
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
            }}
            scroll={{ x: 'max-content' }}
            className="[&_.ant-table-wrapper]:bg-transparent [&_.ant-table]:bg-white [&_.ant-table]:dark:bg-gray-900 [&_.ant-table-container]:bg-white [&_.ant-table-container]:dark:bg-gray-900 [&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:dark:bg-gray-800 [&_.ant-table-thead>tr>th]:px-4 [&_.ant-table-thead>tr>th]:py-3 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-gray-700 [&_.ant-table-thead>tr>th]:dark:text-gray-300 [&_.ant-table-tbody>tr>td]:px-4 [&_.ant-table-tbody>tr>td]:py-3 [&_.ant-table-tbody>tr>td]:text-gray-800 [&_.ant-table-tbody>tr>td]:dark:text-gray-200 [&_.ant-table-tbody>tr]:bg-white [&_.ant-table-tbody>tr]:dark:bg-gray-900 [&_.ant-table-tbody>tr:hover]:bg-gray-50 [&_.ant-table-tbody>tr:hover]:dark:bg-gray-800/50 [&_.ant-table]:text-sm [&_.ant-table-container]:border-gray-200 [&_.ant-table-container]:dark:border-gray-700"
          />
        </div>
      </ComponentCard>

      {/* View User Details Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} className="max-w-[1200px] m-4">
        <div className="no-scrollbar relative w-full max-w-[1200px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          {selectedUser && (
            <>
              <div className="px-2 pr-14">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                  User Details
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                  View detailed information about this user.
                </p>
              </div>
              <div className="px-2 pb-3">
                <div className="space-y-6">
                  {/* Profile Picture and Basic Info */}
                  <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    {selectedUser.profilePicture ? (
                      <img
                        src={selectedUser.profilePicture}
                        alt={selectedUser.username}
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                        <UserOutlined className="text-4xl text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h5 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-1">
                        {selectedUser.username}
                      </h5>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        {selectedUser.email}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          status={
                            selectedUser.role === 'Superadmin'
                              ? 'error'
                              : selectedUser.role === 'EventOrganizer'
                              ? 'processing'
                              : 'success'
                          }
                          text={<span className="text-sm capitalize text-gray-800 dark:text-gray-200">{selectedUser.role}</span>}
                        />
                        <Badge
                          status={selectedUser.isVerified ? 'success' : 'warning'}
                          text={
                            <span className="text-sm text-gray-800 dark:text-gray-200">
                              {selectedUser.isVerified ? 'Verified' : 'Unverified'}
                            </span>
                          }
                        />
                        <Badge
                          status={selectedUser.isBlocked ? 'error' : 'success'}
                          text={
                            <span className="text-sm text-gray-800 dark:text-gray-200">
                              {selectedUser.isBlocked ? 'Blocked' : 'Active'}
                            </span>
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* User Information - Two Column Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                      <Label>Full Name</Label>
                      <p className="text-gray-800 dark:text-white/90 mt-1">
                        {selectedUser.firstname && selectedUser.lastname
                          ? `${selectedUser.firstname} ${selectedUser.lastname}`
                          : 'Not provided'}
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                      <Label>Email</Label>
                      <p className="text-gray-800 dark:text-white/90 mt-1 break-all">
                        {selectedUser.email}
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                      <Label>Phone Number</Label>
                      <p className="text-gray-800 dark:text-white/90 mt-1">
                        {selectedUser.phone_number || 'Not provided'}
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                      <Label>Role</Label>
                      <div className="mt-1">
                        <Badge
                          status={
                            selectedUser.role === 'Superadmin'
                              ? 'error'
                              : selectedUser.role === 'EventOrganizer'
                              ? 'processing'
                              : 'success'
                          }
                          text={<span className="text-sm capitalize text-gray-800 dark:text-gray-200">{selectedUser.role}</span>}
                        />
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                      <Label>Verification Status</Label>
                      <div className="mt-1">
                        <Badge
                          status={selectedUser.isVerified ? 'success' : 'warning'}
                          text={
                            <span className="text-sm text-gray-800 dark:text-gray-200">
                              {selectedUser.isVerified ? 'Verified' : 'Unverified'}
                            </span>
                          }
                        />
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                      <Label>Account Status</Label>
                      <div className="mt-1">
                        <Badge
                          status={selectedUser.isBlocked ? 'error' : 'success'}
                          text={
                            <span className="text-sm text-gray-800 dark:text-gray-200">
                              {selectedUser.isBlocked ? 'Blocked' : 'Active'}
                            </span>
                          }
                        />
                      </div>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                      <Label>Account Created</Label>
                      <p className="text-gray-800 dark:text-white/90 mt-1">
                        {new Date(selectedUser.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700">
                      <Label>Last Updated</Label>
                      <p className="text-gray-800 dark:text-white/90 mt-1">
                        {new Date(selectedUser.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Organizer Details - Full Width */}
                  {selectedUser.organizerDetails && (
                    <div className="p-4 border border-gray-200 rounded-lg dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
                      <Label className="text-base font-semibold">Organizer Details</Label>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedUser.organizerDetails.companyName && (
                          <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Company:</span>
                            <p className="text-gray-800 dark:text-white/90 mt-1">
                              {selectedUser.organizerDetails.companyName}
                            </p>
                          </div>
                        )}
                        {selectedUser.organizerDetails.status && (
                          <div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                            <div className="mt-1">
                              <Badge
                                status={
                                  selectedUser.organizerDetails.status === 'Approved'
                                    ? 'success'
                                    : selectedUser.organizerDetails.status === 'Pending'
                                    ? 'warning'
                                    : 'error'
                                }
                                text={<span className="text-sm text-gray-800 dark:text-gray-200">{selectedUser.organizerDetails.status}</span>}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                <ButtonComponent size="sm" variant="outline" onClick={() => setViewModalOpen(false)}>
                  Close
                </ButtonComponent>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Update Role Modal */}
      <Modal isOpen={roleModalOpen} onClose={() => setRoleModalOpen(false)} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          {selectedUser && (
            <>
              <div className="px-2 pr-14">
                <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
                  Update User Role
                </h4>
                <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
                  Change the role for {selectedUser.username}
                </p>
              </div>
              <div className="px-2 pb-3">
                <div className="mb-6">
                  <Label>Current Role</Label>
                  <div className="mt-2">
                    <Badge
                      status={
                        selectedUser.role === 'Superadmin'
                          ? 'error'
                          : selectedUser.role === 'EventOrganizer'
                          ? 'processing'
                          : 'success'
                      }
                      text={<span className="text-sm capitalize">{selectedUser.role}</span>}
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <Label>New Role <span className="text-red-500">*</span></Label>
                  <Select
                    value={newRole}
                    onChange={(value) => setNewRole(value)}
                    style={{ width: '100%' }}
                    size="large"
                    className="mt-2"
                  >
                    <Option value="EventOrganizer">Event Organizer</Option>
                    <Option value="Hiker">Hiker</Option>
                  </Select>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Note: Superadmin role cannot be changed.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
                <ButtonComponent
                  size="sm"
                  variant="outline"
                  onClick={() => setRoleModalOpen(false)}
                >
                  Cancel
                </ButtonComponent>
                <ButtonComponent
                  size="sm"
                  onClick={handleSaveRole}
                  disabled={actionLoading || !newRole || newRole === selectedUser.role}
                >
                  {actionLoading ? "Updating..." : "Update Role"}
                </ButtonComponent>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

