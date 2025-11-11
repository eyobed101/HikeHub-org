import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { getUserRole } from "../../utils/userRole";
import axiosInstance from "../../utils/axiosInstance";
import { Spin, Input, Select, Table, Badge, Button, Space, message, Popconfirm, Pagination } from "antd";
import { SearchOutlined, EyeOutlined, EditOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import ButtonComponent from "../../components/ui/Button/Button";
import TextArea from "antd/es/input/TextArea";

const { Option } = Select;

// Account types enum matching backend
const ACCOUNT_TYPES = ['Checking', 'Savings', 'Current', 'Business'] as const;

interface BankTemplate {
  _id: string;
  bankName: string;
  bankCode?: string;
  accountTypes: string[];
  swiftCode?: string;
  isActive: boolean;
  createdBy?: {
    _id: string;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function BankTemplates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<BankTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active"); // Default to showing only active templates
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BankTemplate | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    bankName: "",
    bankCode: "",
    accountTypes: [] as string[], // Still array for backend, but single select in UI
    swiftCode: "",
    isActive: true,
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check role on mount
  useEffect(() => {
    const role = getUserRole();
    if (role !== 'Superadmin') {
      navigate('/superadmin');
    }
  }, [navigate]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('bank-templates');
      if (response.data.status === 1) {
        setTemplates(response.data.data || []);
      } else {
        message.error(response.data.message || "Failed to fetch bank templates");
      }
    } catch (error: any) {
      console.error("Error fetching bank templates:", error);
      message.error(error.response?.data?.message || "Failed to fetch bank templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !debouncedSearchQuery || 
      template.bankName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      template.bankCode?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      template.swiftCode?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
    
    // Filter by status: 'active' shows only active, 'inactive' shows only inactive, empty string shows all
    const matchesStatus = !statusFilter || statusFilter === '' ||
      (statusFilter === 'active' && template.isActive) ||
      (statusFilter === 'inactive' && !template.isActive);

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle view
  const handleView = (template: BankTemplate) => {
    setSelectedTemplate(template);
    setViewModalOpen(true);
  };

  // Handle create
  const handleCreate = () => {
    setFormData({
      bankName: "",
      bankCode: "",
      accountTypes: [],
      swiftCode: "",
      isActive: true,
    });
    setCreateModalOpen(true);
  };

  // Handle edit
  const handleEdit = (template: BankTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      bankName: template.bankName,
      bankCode: template.bankCode || "",
      accountTypes: template.accountTypes && template.accountTypes.length > 0 ? template.accountTypes : [],
      swiftCode: template.swiftCode || "",
      isActive: template.isActive,
    });
    setEditModalOpen(true);
  };

  // Handle save (create or update)
  const handleSave = async () => {
    if (!formData.bankName.trim()) {
      message.error("Bank name is required");
      return;
    }

    // Validate account types if provided
    if (formData.accountTypes && formData.accountTypes.length > 0) {
      const invalidTypes = formData.accountTypes.filter(
        (type: string) => !ACCOUNT_TYPES.includes(type as any)
      );
      if (invalidTypes.length > 0) {
        message.error(`Invalid account types: ${invalidTypes.join(', ')}. Valid types are: ${ACCOUNT_TYPES.join(', ')}`);
        return;
      }
    }

    try {
      setActionLoading(true);
      // Prepare data - use all account types if none selected
      const dataToSend = {
        ...formData,
        accountTypes: formData.accountTypes && formData.accountTypes.length > 0 
          ? formData.accountTypes 
          : ACCOUNT_TYPES
      };

      if (createModalOpen) {
        // Create
        const response = await axiosInstance.post('bank-templates', dataToSend);
        if (response.data && response.data.status === 1) {
          message.success(response.data.message || "Bank template created successfully");
          setCreateModalOpen(false);
          fetchTemplates();
        } else {
          message.error(response.data?.message || "Failed to create bank template");
        }
      } else if (editModalOpen && selectedTemplate) {
        // Update
        const response = await axiosInstance.put(`bank-templates/${selectedTemplate._id}`, dataToSend);
        if (response.data && response.data.status === 1) {
          message.success(response.data.message || "Bank template updated successfully");
          setEditModalOpen(false);
          fetchTemplates();
        } else {
          message.error(response.data?.message || "Failed to update bank template");
        }
      }
    } catch (error: any) {
      console.error("Error saving bank template:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to save bank template";
      message.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (templateId: string) => {
    try {
      setActionLoading(true);
      // Backend expects :templateId parameter
      const response = await axiosInstance.delete(`bank-templates/${templateId}`);
      
      // Check response structure
      if (response.data) {
        if (response.data.status === 1) {
          message.success(response.data.message || "Bank template deleted successfully");
          // Refresh the templates list - deleted templates will be filtered out if statusFilter is 'active'
          await fetchTemplates();
        } else {
          // Backend returned an error status
          message.error(response.data.message || "Failed to delete bank template");
        }
      } else {
        // No data in response, but status might be 200
        if (response.status === 200) {
          message.success("Bank template deleted successfully");
          await fetchTemplates();
        } else {
          message.error("Failed to delete bank template");
        }
      }
    } catch (error: any) {
      console.error("Error deleting bank template:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to delete bank template";
      message.error(errorMessage);
    } finally {
      setActionLoading(false);
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

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge status="success" text="Active" />;
    }
    return <Badge status="default" text="Inactive" />;
  };

  // Table columns
  const columns = [
    {
      title: 'Bank Name',
      dataIndex: 'bankName',
      key: 'bankName',
      width: 200,
      fixed: 'left' as const,
      render: (name: string) => (
        <span className="font-semibold text-gray-800 dark:text-gray-200 text-xs">{name}</span>
      ),
    },
    {
      title: 'Bank Code',
      dataIndex: 'bankCode',
      key: 'bankCode',
      width: 120,
      render: (code: string) => (
        <span className="text-gray-800 dark:text-gray-200 text-xs">{code || 'N/A'}</span>
      ),
    },
    {
      title: 'SWIFT Code',
      dataIndex: 'swiftCode',
      key: 'swiftCode',
      width: 120,
      render: (code: string) => (
        <span className="text-gray-800 dark:text-gray-200 text-xs font-mono">{code || 'N/A'}</span>
      ),
    },
    {
      title: 'Account Types',
      dataIndex: 'accountTypes',
      key: 'accountTypes',
      width: 200,
      render: (types: string[]) => (
        <div className="flex flex-wrap gap-1">
          {types && types.length > 0 ? (
            types.map((type, index) => (
              <Badge
                key={index}
                count={type}
                style={{ backgroundColor: '#3b82f6' }}
                className="text-xs"
              />
            ))
          ) : (
            <span className="text-gray-500 dark:text-gray-400 text-xs">N/A</span>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => getStatusBadge(isActive),
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
      width: 150,
      fixed: 'right' as const,
      render: (record: BankTemplate) => (
        <Space size="small" className="flex-wrap">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            className="text-blue-600 dark:text-blue-400 p-0 h-auto text-xs"
            size="small"
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="text-green-600 dark:text-green-400 p-0 h-auto text-xs"
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Bank Template"
            description="Are you sure you want to delete this bank template? This will deactivate it."
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              icon={<DeleteOutlined />}
              className="text-red-600 dark:text-red-400 p-0 h-auto text-xs"
              size="small"
              danger
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading && templates.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Bank Templates - Superadmin" />
      <PageBreadcrumb pageName="Bank Templates" />

      <div className="space-y-6 overflow-x-hidden">
        {/* Filters and Actions */}
        <ComponentCard>
          <div className="p-3 md:p-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 min-w-0">
                <Input
                  placeholder="Search by bank name, code, or SWIFT code..."
                  prefix={<SearchOutlined />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="large"
                  allowClear
                />
              </div>
              <div className="w-full sm:w-40 min-w-0">
                <Select
                  placeholder="Filter by status"
                  value={statusFilter || undefined}
                  onChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                  allowClear
                  size="large"
                  className="w-full"
                >
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
                size="large"
                className="whitespace-nowrap"
              >
                Add Template
              </Button>
            </div>
          </div>
        </ComponentCard>

        {/* Table */}
        <ComponentCard>
          <div className="p-3 md:p-4 overflow-x-hidden">
            <div className="overflow-x-auto">
              <Spin spinning={loading}>
                <Table
                  columns={columns}
                  dataSource={paginatedTemplates}
                  rowKey="_id"
                  pagination={false}
                  scroll={{ x: 900 }}
                  size="middle"
                  className="[&_.ant-table-wrapper]:bg-transparent [&_.ant-table]:bg-white [&_.ant-table]:dark:bg-gray-900 [&_.ant-table-container]:bg-white [&_.ant-table-container]:dark:bg-gray-900 [&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:dark:bg-gray-800 [&_.ant-table-thead>tr>th]:px-2 [&_.ant-table-thead>tr>th]:py-2 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-xs [&_.ant-table-thead>tr>th]:text-gray-700 [&_.ant-table-thead>tr>th]:dark:text-gray-300 [&_.ant-table-tbody>tr>td]:px-2 [&_.ant-table-tbody>tr>td]:py-2 [&_.ant-table-tbody>tr>td]:text-xs [&_.ant-table-tbody>tr]:bg-white [&_.ant-table-tbody>tr]:dark:bg-gray-900 [&_.ant-table-tbody>tr:hover]:bg-gray-50 [&_.ant-table-tbody>tr:hover]:dark:bg-gray-800/50 [&_.ant-table-container]:border-gray-200 [&_.ant-table-container]:dark:border-gray-700"
                />
              </Spin>

              {/* Pagination */}
              {filteredTemplates.length > 0 && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
                    Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                    {Math.min(currentPage * pageSize, filteredTemplates.length)} of{' '}
                    {filteredTemplates.length} templates
                  </div>
                  <Pagination
                    current={currentPage}
                    total={filteredTemplates.length}
                    pageSize={pageSize}
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
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* View Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        className="max-w-[700px] w-[90%] mx-auto my-8"
      >
        {selectedTemplate && (
          <div className="p-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {selectedTemplate.bankName}
                  </h3>
                  <div className="mt-1">
                    {getStatusBadge(selectedTemplate.isActive)}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5">
                  <Label className="text-[10px] text-gray-500 dark:text-gray-400">Bank Name</Label>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5 truncate" title={selectedTemplate.bankName}>
                    {selectedTemplate.bankName}
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5">
                  <Label className="text-[10px] text-gray-500 dark:text-gray-400">Bank Code</Label>
                  <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5 truncate" title={selectedTemplate.bankCode || 'N/A'}>
                    {selectedTemplate.bankCode || 'N/A'}
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5">
                  <Label className="text-[10px] text-gray-500 dark:text-gray-400">SWIFT Code</Label>
                  <p className="text-xs font-mono text-gray-800 dark:text-gray-200 mt-0.5 truncate" title={selectedTemplate.swiftCode || 'N/A'}>
                    {selectedTemplate.swiftCode || 'N/A'}
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5">
                  <Label className="text-[10px] text-gray-500 dark:text-gray-400">Status</Label>
                  <div className="mt-0.5">
                    {getStatusBadge(selectedTemplate.isActive)}
                  </div>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 col-span-2">
                  <Label className="text-[10px] text-gray-500 dark:text-gray-400">Account Types</Label>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {selectedTemplate.accountTypes && selectedTemplate.accountTypes.length > 0 ? (
                      selectedTemplate.accountTypes.map((type, index) => (
                        <Badge
                          key={index}
                          count={type}
                          style={{ backgroundColor: '#3b82f6', fontSize: '10px' }}
                          className="text-[10px]"
                        />
                      ))
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-[10px]">N/A</span>
                    )}
                  </div>
                </div>
                {selectedTemplate.createdBy && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5">
                    <Label className="text-[10px] text-gray-500 dark:text-gray-400">Created By</Label>
                    <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5 truncate" title={selectedTemplate.createdBy.username || 'N/A'}>
                      {selectedTemplate.createdBy.username || 'N/A'}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate" title={selectedTemplate.createdBy.email || 'N/A'}>
                      {selectedTemplate.createdBy.email || 'N/A'}
                    </p>
                  </div>
                )}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5">
                  <Label className="text-[10px] text-gray-500 dark:text-gray-400">Created Date</Label>
                  <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5">
                    {formatDate(selectedTemplate.createdAt)}
                  </p>
                </div>
                {selectedTemplate.createdBy && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5">
                    <Label className="text-[10px] text-gray-500 dark:text-gray-400">Last Updated</Label>
                    <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5">
                      {formatDate(selectedTemplate.updatedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-2 mt-3 flex justify-end gap-2">
              <ButtonComponent
                variant="outline"
                onClick={() => setViewModalOpen(false)}
                className="text-xs px-3 py-1.5"
              >
                Close
              </ButtonComponent>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={createModalOpen || editModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditModalOpen(false);
        }}
        className="max-w-[600px] w-[90%] mx-auto my-8"
      >
        <div className="p-4 max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {createModalOpen ? "Create Bank Template" : "Edit Bank Template"}
            </h3>
          </div>

          {/* Content */}
          <div className="overflow-y-auto custom-scrollbar flex-1">
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Bank Name *</Label>
                <Input
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="Enter bank name"
                  size="middle"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Bank Code</Label>
                <Input
                  value={formData.bankCode}
                  onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                  placeholder="Enter bank code"
                  size="middle"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">SWIFT Code</Label>
                <Input
                  value={formData.swiftCode}
                  onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                  placeholder="Enter SWIFT code"
                  size="middle"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Account Type</Label>
                <Select
                  value={formData.accountTypes && formData.accountTypes.length > 0 ? formData.accountTypes[0] : undefined}
                  onChange={(value) => {
                    // Convert single value to array for backend compatibility
                    const selectedType = value && ACCOUNT_TYPES.includes(value as any) ? value : null;
                    setFormData({ 
                      ...formData, 
                      accountTypes: selectedType ? [selectedType] : [] 
                    });
                  }}
                  placeholder="Select account type (optional)"
                  size="middle"
                  className="w-full mt-1"
                  allowClear
                  showSearch={false}
                  getPopupContainer={(trigger) => trigger.parentElement || document.body}
                  dropdownStyle={{ zIndex: 1050 }}
                  options={ACCOUNT_TYPES.map((type) => ({
                    label: type,
                    value: type,
                  }))}
                />
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  Select an account type. Leave empty to use all types ({ACCOUNT_TYPES.join(', ')}) by default.
                </p>
              </div>

              {editModalOpen && (
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
                    size="middle"
                    className="w-full mt-1"
                    getPopupContainer={(trigger) => trigger.parentElement || document.body}
                    dropdownStyle={{ zIndex: 1050 }}
                    options={[
                      { label: 'Active', value: 'active' },
                      { label: 'Inactive', value: 'inactive' },
                    ]}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-2 mt-3 flex justify-end gap-2">
            <ButtonComponent
              variant="outline"
              onClick={() => {
                setCreateModalOpen(false);
                setEditModalOpen(false);
              }}
              disabled={actionLoading}
              className="text-xs px-3 py-1.5"
            >
              Cancel
            </ButtonComponent>
            <ButtonComponent
              onClick={handleSave}
              disabled={actionLoading}
              className="text-xs px-3 py-1.5"
            >
              {actionLoading ? 'Saving...' : createModalOpen ? 'Create' : 'Update'}
            </ButtonComponent>
          </div>
        </div>
      </Modal>
    </>
  );
}

