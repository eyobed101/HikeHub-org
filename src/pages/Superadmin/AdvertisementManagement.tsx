import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { getUserRole } from "../../utils/userRole";
import axiosInstance from "../../utils/axiosInstance";
import { Spin, Input, Table, Badge, Button, Space, message, Popconfirm, Pagination, DatePicker } from "antd";
import { SearchOutlined, EyeOutlined, EditOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { Modal } from "../../components/ui/modal";
import Label from "../../components/form/Label";
import ButtonComponent from "../../components/ui/Button/Button";
import dayjs, { Dayjs } from "dayjs";
import type { UploadFile } from "antd/es/upload/interface";
import { Upload } from "antd";

const { RangePicker } = DatePicker;

interface Advertisement {
  _id: string;
  companyName: string;
  images: string[];
  contact?: string;
  url: string;
  address: string;
  launchDate: string;
  endDate: string;
  price: number;
  createdAt: string;
}

export default function AdvertisementManagement() {
  const navigate = useNavigate();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedAdvertisement, setSelectedAdvertisement] = useState<Advertisement | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    companyName: "",
    contact: "",
    url: "",
    address: "",
    launchDate: null as Dayjs | null,
    endDate: null as Dayjs | null,
    price: 0,
  });

  const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);

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

  // Fetch advertisements
  const fetchAdvertisements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('ads');
      if (response.data && Array.isArray(response.data)) {
        setAdvertisements(response.data);
      } else {
        message.error("Failed to fetch advertisements");
      }
    } catch (error: any) {
      console.error("Error fetching advertisements:", error);
      message.error(error.response?.data?.message || "Failed to fetch advertisements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdvertisements();
  }, [fetchAdvertisements]);

  // Filter advertisements
  const filteredAdvertisements = advertisements.filter(ad => {
    const matchesSearch = !debouncedSearchQuery || 
      ad.companyName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      ad.address.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (ad.contact && ad.contact.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));
    
    const matchesDateRange = !dateRange || !dateRange[0] || !dateRange[1] || (
      dayjs(ad.launchDate).isAfter(dateRange[0].subtract(1, 'day')) &&
      dayjs(ad.endDate).isBefore(dateRange[1].add(1, 'day'))
    );

    return matchesSearch && matchesDateRange;
  });

  // Pagination
  const paginatedAdvertisements = filteredAdvertisements.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return "N/A";
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Get status badge
  const getStatusBadge = (launchDate: string, endDate: string) => {
    const now = dayjs();
    const launch = dayjs(launchDate);
    const end = dayjs(endDate);

    if (now.isBefore(launch)) {
      return <Badge status="default" text="Scheduled" />;
    } else if (now.isAfter(end)) {
      return <Badge status="error" text="Expired" />;
    } else {
      return <Badge status="success" text="Active" />;
    }
  };

  // Handle view
  const handleView = (ad: Advertisement) => {
    setSelectedAdvertisement(ad);
    setViewModalOpen(true);
  };

  // Handle edit
  const handleEdit = (ad: Advertisement) => {
    setSelectedAdvertisement(ad);
    setFormData({
      companyName: ad.companyName,
      contact: ad.contact || "",
      url: ad.url,
      address: ad.address,
      launchDate: dayjs(ad.launchDate),
      endDate: dayjs(ad.endDate),
      price: ad.price,
    });
    setImageFileList([]);
    setEditModalOpen(true);
  };

  // Handle create
  const handleCreate = () => {
    setSelectedAdvertisement(null);
    setFormData({
      companyName: "",
      contact: "",
      url: "",
      address: "",
      launchDate: null,
      endDate: null,
      price: 0,
    });
    setImageFileList([]);
    setCreateModalOpen(true);
  };

  // Handle save (create or update)
  const handleSave = async () => {
    if (!formData.companyName || !formData.url || !formData.address || !formData.launchDate || !formData.endDate || formData.price <= 0) {
      message.error("Please fill in all required fields");
      return;
    }

    if (formData.launchDate.isAfter(formData.endDate)) {
      message.error("Launch date must be before end date");
      return;
    }

    if (createModalOpen && imageFileList.length === 0) {
      message.error("Please upload at least one image");
      return;
    }

    try {
      setActionLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append('companyName', formData.companyName);
      formDataToSend.append('contact', formData.contact);
      formDataToSend.append('url', formData.url);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('launchDate', formData.launchDate.format('YYYY-MM-DD'));
      formDataToSend.append('endDate', formData.endDate.format('YYYY-MM-DD'));
      formDataToSend.append('price', formData.price.toString());

      // Append images
      imageFileList.forEach((file) => {
        if (file.originFileObj) {
          formDataToSend.append('images', file.originFileObj);
        }
      });

      if (createModalOpen) {
        await axiosInstance.post('ads', formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        message.success("Advertisement created successfully");
        setCreateModalOpen(false);
      } else {
        await axiosInstance.put(`ads/${selectedAdvertisement?._id}`, formDataToSend, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        message.success("Advertisement updated successfully");
        setEditModalOpen(false);
      }

      fetchAdvertisements();
      setFormData({
        companyName: "",
        contact: "",
        url: "",
        address: "",
        launchDate: null,
        endDate: null,
        price: 0,
      });
      setImageFileList([]);
    } catch (error: any) {
      console.error("Error saving advertisement:", error);
      message.error(error.response?.data?.message || "Failed to save advertisement");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      setActionLoading(true);
      await axiosInstance.delete(`ads/${id}`);
      message.success("Advertisement deleted successfully");
      fetchAdvertisements();
    } catch (error: any) {
      console.error("Error deleting advertisement:", error);
      message.error(error.response?.data?.message || "Failed to delete advertisement");
    } finally {
      setActionLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      title: "Company Name",
      dataIndex: "companyName",
      key: "companyName",
      width: 160,
      fixed: 'left' as const,
      render: (text: string, record: Advertisement) => (
        <div className="flex items-center gap-1.5">
          {record.images && record.images.length > 0 && (
            <img
              src={`/uploads/${record.images[0]}`}
              alt={text}
              className="w-8 h-8 object-cover rounded flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/user/user-01.jpg';
              }}
            />
          )}
          <span className="font-medium text-gray-800 dark:text-gray-200 text-xs truncate">{text}</span>
        </div>
      ),
    },
    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
      width: 120,
      render: (text: string) => (
        <span className="text-xs text-gray-800 dark:text-gray-200 truncate block">{text || "N/A"}</span>
      ),
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      width: 150,
      render: (url: string) => (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline truncate block text-xs max-w-[150px]"
          title={url}
        >
          {url}
        </a>
      ),
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      width: 150,
      render: (text: string) => (
        <span className="truncate block text-xs text-gray-800 dark:text-gray-200 max-w-[150px]" title={text}>{text}</span>
      ),
    },
    {
      title: "Launch Date",
      dataIndex: "launchDate",
      key: "launchDate",
      width: 100,
      render: (date: string) => (
        <span className="text-xs text-gray-800 dark:text-gray-200 whitespace-nowrap">{formatDate(date)}</span>
      ),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      width: 100,
      render: (date: string) => (
        <span className="text-xs text-gray-800 dark:text-gray-200 whitespace-nowrap">{formatDate(date)}</span>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      width: 100,
      render: (price: number) => (
        <span className="text-xs text-gray-800 dark:text-gray-200 whitespace-nowrap">{formatCurrency(price)}</span>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      render: (_: any, record: Advertisement) => getStatusBadge(record.launchDate, record.endDate),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 100,
      render: (date: string) => (
        <span className="text-xs text-gray-800 dark:text-gray-200 whitespace-nowrap">{formatDate(date)}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: Advertisement) => (
        <Space size="small" className="flex-wrap">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            className="text-blue-600 dark:text-blue-400 p-0 text-xs"
            size="small"
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="text-green-600 dark:text-green-400 p-0 text-xs"
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Advertisement"
            description="Are you sure you want to delete this advertisement?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              className="text-red-600 dark:text-red-400 p-0 text-xs"
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageMeta title="Advertisement Management" />
      <PageBreadcrumb pageTitle="Advertisement Management" />

      <div className="overflow-x-hidden w-full max-w-full">
        {/* Filters */}
        <ComponentCard title="Filters" className="mb-4 p-3 md:p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Search by company name, address, or contact"
                prefix={<SearchOutlined />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                allowClear
                className="mt-1"
              />
            </div>
            <div>
              <Label>Date Range</Label>
              <RangePicker
                className="w-full mt-1"
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
                format="YYYY-MM-DD"
              />
            </div>
            <div className="flex items-end">
              <ButtonComponent
                onClick={() => {
                  setSearchQuery("");
                  setDateRange(null);
                }}
                variant="outline"
                className="w-full"
              >
                Reset Filters
              </ButtonComponent>
            </div>
          </div>
        </ComponentCard>

        {/* Table */}
        <ComponentCard className="p-3 md:p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              Advertisements
            </h3>
            <ButtonComponent onClick={handleCreate} icon={<PlusOutlined />} className="text-xs px-3 py-1.5">
              Add Advertisement
            </ButtonComponent>
          </div>
          <Spin spinning={loading}>
            <div className="overflow-x-auto w-full">
              <Table
                columns={columns}
                dataSource={paginatedAdvertisements}
                rowKey="_id"
                pagination={false}
                size="small"
                scroll={{ x: 1120 }}
                className="[&_.ant-table-wrapper]:bg-transparent [&_.ant-table]:bg-white [&_.ant-table]:dark:bg-gray-900 [&_.ant-table-container]:bg-white [&_.ant-table-container]:dark:bg-gray-900 [&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:dark:bg-gray-800 [&_.ant-table-thead>tr>th]:px-3 [&_.ant-table-thead>tr>th]:py-2 [&_.ant-table-thead>tr>th]:font-semibold [&_.ant-table-thead>tr>th]:text-xs [&_.ant-table-thead>tr>th]:text-gray-700 [&_.ant-table-thead>tr>th]:dark:text-gray-300 [&_.ant-table-tbody>tr>td]:px-3 [&_.ant-table-tbody>td]:py-2 [&_.ant-table-tbody>tr>td]:text-gray-800 [&_.ant-table-tbody>tr>td]:dark:text-gray-200 [&_.ant-table-tbody>tr]:bg-white [&_.ant-table-tbody>tr]:dark:bg-gray-900 [&_.ant-table-tbody>tr:hover]:bg-gray-50 [&_.ant-table-tbody>tr:hover]:dark:bg-gray-800/50 [&_.ant-table]:text-xs [&_.ant-table-container]:border-gray-200 [&_.ant-table-container]:dark:border-gray-700"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredAdvertisements.length}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size || 30);
                }}
                onShowSizeChange={(current, size) => {
                  setCurrentPage(1);
                  setPageSize(size);
                }}
                showSizeChanger
                showQuickJumper
                pageSizeOptions={['10', '20', '30', '50', '100']}
                showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} advertisements`}
              />
            </div>
          </Spin>
        </ComponentCard>
      </div>

      {/* View Modal */}
      <Modal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        className="max-w-[700px] w-[90%] mx-auto my-8"
      >
        {selectedAdvertisement && (
          <div className="p-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 pb-2 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {selectedAdvertisement.companyName}
                  </h3>
                  <div className="mt-1">
                    {getStatusBadge(selectedAdvertisement.launchDate, selectedAdvertisement.endDate)}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5">
                  <Label className="text-[10px] text-gray-500 dark:text-gray-400">Company Name</Label>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5 truncate" title={selectedAdvertisement.companyName}>
                    {selectedAdvertisement.companyName}
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5">
                  <Label className="text-[10px] text-gray-500 dark:text-gray-400">Contact</Label>
                  <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5 truncate" title={selectedAdvertisement.contact || 'N/A'}>
                    {selectedAdvertisement.contact || 'N/A'}
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 col-span-2">
                  <Label className="text-[10px] text-gray-500 dark:text-gray-400">URL</Label>
                  <a
                    href={selectedAdvertisement.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block mt-0.5"
                    title={selectedAdvertisement.url}
                  >
                    {selectedAdvertisement.url}
                  </a>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 col-span-2">
                  <Label className="text-[10px] text-gray-500 dark:text-gray-400">Address</Label>
                  <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5 truncate" title={selectedAdvertisement.address}>
                    {selectedAdvertisement.address}
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5">
                  <Label className="text-[10px] text-gray-500 dark:text-gray-400">Launch Date</Label>
                  <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5">
                    {formatDate(selectedAdvertisement.launchDate)}
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5">
                  <Label className="text-[10px] text-gray-500 dark:text-gray-400">End Date</Label>
                  <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5">
                    {formatDate(selectedAdvertisement.endDate)}
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5">
                  <Label className="text-[10px] text-gray-500 dark:text-gray-400">Price</Label>
                  <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
                    {formatCurrency(selectedAdvertisement.price)}
                  </p>
                </div>
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5">
                  <Label className="text-[10px] text-gray-500 dark:text-gray-400">Status</Label>
                  <div className="mt-0.5">
                    {getStatusBadge(selectedAdvertisement.launchDate, selectedAdvertisement.endDate)}
                  </div>
                </div>
                {selectedAdvertisement.images && selectedAdvertisement.images.length > 0 && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 col-span-2">
                    <Label className="text-[10px] text-gray-500 dark:text-gray-400">Images</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1.5">
                      {selectedAdvertisement.images.map((image, index) => (
                        <img
                          key={index}
                          src={`/uploads/${image}`}
                          alt={`${selectedAdvertisement.companyName} ${index + 1}`}
                          className="w-full h-24 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/user/user-01.jpg';
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2.5">
                  <Label className="text-[10px] text-gray-500 dark:text-gray-400">Created Date</Label>
                  <p className="text-xs text-gray-800 dark:text-gray-200 mt-0.5">
                    {formatDate(selectedAdvertisement.createdAt)}
                  </p>
                </div>
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
              {createModalOpen ? "Create Advertisement" : "Edit Advertisement"}
            </h3>
          </div>

          {/* Content */}
          <div className="overflow-y-auto custom-scrollbar flex-1">
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Company Name *</Label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Enter company name"
                  size="middle"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Contact</Label>
                <Input
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="Enter contact details"
                  size="middle"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">URL *</Label>
                <Input
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  placeholder="https://www.example.com"
                  size="middle"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Address *</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                  size="middle"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Launch Date *</Label>
                  <DatePicker
                    className="w-full mt-1"
                    value={formData.launchDate}
                    onChange={(date) => setFormData({ ...formData, launchDate: date })}
                    format="YYYY-MM-DD"
                    size="middle"
                  />
                </div>
                <div>
                  <Label className="text-xs">End Date *</Label>
                  <DatePicker
                    className="w-full mt-1"
                    value={formData.endDate}
                    onChange={(date) => setFormData({ ...formData, endDate: date })}
                    format="YYYY-MM-DD"
                    size="middle"
                    disabledDate={(current) => 
                      formData.launchDate ? current && current < formData.launchDate : false
                    }
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Price *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  size="middle"
                  className="mt-1"
                  min={0}
                  step={0.01}
                />
              </div>

              <div>
                <Label className="text-xs">Images {createModalOpen ? '*' : ''}</Label>
                <Upload
                  listType="picture-card"
                  fileList={imageFileList}
                  onChange={({ fileList }) => setImageFileList(fileList)}
                  beforeUpload={() => false}
                  maxCount={3}
                  className="mt-1"
                >
                  {imageFileList.length < 3 && (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
                {editModalOpen && selectedAdvertisement && selectedAdvertisement.images && selectedAdvertisement.images.length > 0 && (
                  <div className="mt-2">
                    <Label className="text-[10px] text-gray-500 dark:text-gray-400">Current Images</Label>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {selectedAdvertisement.images.map((image, index) => (
                        <img
                          key={index}
                          src={`/uploads/${image}`}
                          alt={`Current ${index + 1}`}
                          className="w-full h-20 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/user/user-01.jpg';
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                      Upload new images to replace existing ones
                    </p>
                  </div>
                )}
              </div>
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

