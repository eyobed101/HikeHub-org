import { useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import EventTable from "../../components/tables/BasicTables/BasicTableOne";
import ManageParticipants from "../../components/tables/ManageParticipant"; // Import the new component
import { Spin, Alert } from "antd";

export default function EventsTable() {
    const [tableData, setTableData] = useState<any[]>([]); // Define tableData as an array of any
    const [allUsers, setAllUsers] = useState<any[]>([]); // Define allUsers as an array of any
    const [loading, setLoading] = useState<boolean>(true); // Define loading as a boolean
    const [error, setError] = useState<string>(""); // Define error as a string

    useEffect(() => {
        const fetchEventsAndUsers = async () => {
            try {
                // Fetch events
                const eventsResponse = await axiosInstance.get<{ data: any[] }>("event/organizer/all");
                const eventData = Array.isArray(eventsResponse.data)
                    ? eventsResponse.data
                    : eventsResponse.data?.data || [];
                setTableData(eventData);

                // Fetch all users
                const usersResponse = await axiosInstance.get<{ data: any[] }>("auth/users"); // Replace with your actual endpoint
                const usersData = usersResponse.data?.Hikers || [];
                console.log("usersData", usersData);
                setAllUsers(usersData);
            } catch (error) {
                console.error("Error fetching data:", error);
                setError("Failed to load data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchEventsAndUsers();
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
                        <>
                            {/* Render the EventTable component */}
                            <EventTable tableData={tableData} />

                            {/* Render the ManageParticipants component */}
                            <ManageParticipants events={tableData} allUsers={allUsers} />
                        </>
                    )}
                </ComponentCard>
            </div>
        </>
    );
}