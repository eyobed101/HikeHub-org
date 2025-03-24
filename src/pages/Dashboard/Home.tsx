import { useState, useEffect } from "react";
import EcommerceMetrics from "../../components/ecommerce/EcommerceMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import axiosInstance from "../../utils/axiosInstance";

export default function Home() {
  const [organizerDetails, setOrganizerDetails] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchOrganizerDetails = async () => {
      try {
        const response = await axiosInstance.get("/auth/organizer/detail");
        const data = response.data; // Assuming the first object is the relevant one
        setOrganizerDetails(data);
      } catch (error) {
        console.error("Error fetching organizer details:", error);
      }
    };

    const fetchEvents = async () => {
      try {
        const response = await axiosInstance.get("/event/organizer/all");
        setEvents(response.data);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchOrganizerDetails();
    fetchEvents();
  }, []);

  if (!organizerDetails || events.length === 0) {
    return <div>Loading...</div>; // Show a loading state while data is being fetched
  }

  return (
    <>
      <PageMeta title="HikeHub | Home" description="" />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          {/* Pass organizer details to EcommerceMetrics */}
          <EcommerceMetrics organizerDetails={organizerDetails} />

          {/* Pass events to MonthlySalesChart */}
          <MonthlySalesChart events={events} />
        </div>

        <div className="col-span-12 xl:col-span-5">
          {/* Pass organizer details to MonthlyTarget */}
          <MonthlyTarget organizerDetails={organizerDetails} />
        </div>

        <div className="col-span-12">
          {/* Pass events to StatisticsChart */}
          <StatisticsChart events={events} />
        </div>

        <div className="col-span-12 xl:col-span-5">
          {/* Pass organizer details to DemographicCard */}
          <DemographicCard organizerDetails={organizerDetails} />
        </div>

        <div className="col-span-12 xl:col-span-7">
          {/* Pass events to RecentOrders */}
          <RecentOrders events={events} />
        </div>
      </div>
    </>
  );
}