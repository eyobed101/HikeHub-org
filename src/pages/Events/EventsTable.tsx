import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import EventTable from "../../components/tables/BasicTables/BasicTableOne";
import { Spin, Alert } from "antd";

export default function EventsTable() {
    const [tableData, setTableData] = useState<any[]>([]); // Define tableData as an array of any
    const [loading, setLoading] = useState<boolean>(true); // Define loading as a boolean
    const [error, setError] = useState<string>(""); // Define error as a string

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await axiosInstance.get<{ data: any[] }>("event/organizer/all");

                console.log("Fetched Data:", response.data);

                const eventData = Array.isArray(response.data)
                    ? response.data
                    : response.data?.data || [];

                setTableData(eventData);
            } catch (error) {
                console.error("Error fetching events:", error);
                setError("Failed to load events. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) {
        return <Spin size="large" className="flex justify-center items-center min-h-screen" />;
    }

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
                        <EventTable tableData={tableData} />
                    )}
                </ComponentCard>
            </div>
        </>
    );
}
