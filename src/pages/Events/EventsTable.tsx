import { useEffect, useState, useCallback } from "react";
import axiosInstance from "../../utils/axiosInstance";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import EventTable from "../../components/tables/BasicTables/BasicTableOne";
import ManageParticipants from "../../components/tables/ManageParticipant";
import { Spin, Alert, Input, Pagination } from "antd";
import { SearchOutlined } from "@ant-design/icons";

interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

interface EventResponse {
    data: any[];
    pagination: PaginationInfo;
}

import { Link } from "react-router";

export default function EventsTable() {
    const [tableData, setTableData] = useState<any[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [organizerStatus, setOrganizerStatus] = useState<string | null>(null);
    
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
    
    // Search state
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");

    // Fetch organizer status on component mount
    useEffect(() => {
        const fetchOrganizerStatus = async () => {
            try {
                const response = await axiosInstance.get("auth/organizer/detail");
                if (response.data?.status) {
                    setOrganizerStatus(response.data.status);
                    sessionStorage.setItem("organizerStatus", response.data.status);
                }
            } catch (error) {
                console.error("Error fetching organizer status:", error);
                const storedStatus = sessionStorage.getItem("organizerStatus");
                if (storedStatus) {
                    setOrganizerStatus(storedStatus);
                }
            }
        };
        fetchOrganizerStatus();
    }, []);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            setCurrentPage(1); // Reset to first page on search
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch events with pagination
    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: pageSize.toString(),
                sortBy: "createdAt",
                sortOrder: "desc",
                ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
            });

            const eventsResponse = await axiosInstance.get<EventResponse>(
                `event/organizer/all?${params.toString()}`
            );
            
            const eventData = eventsResponse.data?.data || [];
            const paginationData = eventsResponse.data?.pagination || {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: 10,
                hasNextPage: false,
                hasPrevPage: false,
            };
            
            setTableData(eventData);
            setPagination(paginationData);
        } catch (error) {
            console.error("Error fetching events:", error);
            setError("Failed to load events. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [currentPage, pageSize, debouncedSearchQuery]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersResponse = await axiosInstance.get<{ data: any[] }>("auth/users");
                const usersData = usersResponse.data?.Hikers || [];
                setAllUsers(usersData);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Handle pagination change
    const handlePageChange = (page: number, pageSize?: number) => {
        setCurrentPage(page);
        if (pageSize) {
            setPageSize(pageSize);
        }
    };

    return (
        <>
            <PageMeta
                title="HikeHub | Events"
                description=""
            />
            <PageBreadcrumb pageTitle="My Events" />
            <div className="space-y-6">

                <ComponentCard title="">
                    {error ? (
                        <Alert
                            message="Error"
                            description={error}
                            type="error"
                            showIcon
                        />
                    ) : (
                        <>
                            {/* Search */}
                            <div className="mb-6">
                                <Input
                                    prefix={<SearchOutlined />}
                                    placeholder="Search events by title, description, or location..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="max-w-md"
                                    allowClear
                                />
                            </div>

                            {loading ? (
                                <Spin size="large" className="flex justify-center items-center py-12" />
                            ) : (
                                <>
                                    {/* Render the EventTable component */}
                                    <EventTable tableData={tableData} organizerStatus={organizerStatus} />

                                    {/* Pagination */}
                                    {pagination.totalItems > 0 && (
                                        <div className="mt-6 flex justify-between items-center">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.totalItems)} of {pagination.totalItems} events
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

                                    {/* Render the ManageParticipants component */}
                                    {/* <ManageParticipants events={tableData} allUsers={allUsers} /> */}
                                </>
                            )}
                        </>
                    )}
                </ComponentCard>
            </div>
        </>
    );
}