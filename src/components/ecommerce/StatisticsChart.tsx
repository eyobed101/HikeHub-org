import { useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ChartTab from "../common/ChartTab";

interface StatisticsChartProps {
  monthlyParticipants: number[];
  monthlyRevenue: number[];
  quarterlyParticipants: number[];
  quarterlyRevenue: number[];
  annualParticipants: number;
  annualRevenue: number;
}

export default function StatisticsChart({ 
  monthlyParticipants = [],
  monthlyRevenue = [],
  quarterlyParticipants = [],
  quarterlyRevenue = [],
  annualParticipants = 0,
  annualRevenue = 0
}: StatisticsChartProps) {
  const [filter, setFilter] = useState("Monthly"); // State to track the selected filter

  // Use data directly from props (already processed on backend)
  const participantsData = Array.isArray(monthlyParticipants) ? monthlyParticipants : new Array(12).fill(0);
  const revenueData = Array.isArray(monthlyRevenue) ? monthlyRevenue : new Array(12).fill(0);
  const quarterlyParticipantsData = Array.isArray(quarterlyParticipants) ? quarterlyParticipants : [0, 0, 0, 0];
  const quarterlyRevenueData = Array.isArray(quarterlyRevenue) ? quarterlyRevenue : [0, 0, 0, 0];

  // Determine the data to display based on the selected filter
  let categories: string[] = [];
  let displayParticipantsData: number[] = [];
  let displayRevenueData: number[] = [];

  if (filter === "Monthly") {
    categories = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    displayParticipantsData = participantsData;
    displayRevenueData = revenueData;
  } else if (filter === "Quarterly") {
    categories = ["Q1", "Q2", "Q3", "Q4"];
    displayParticipantsData = quarterlyParticipantsData;
    displayRevenueData = quarterlyRevenueData;
  } else if (filter === "Annually") {
    categories = ["Annual"];
    displayParticipantsData = [annualParticipants];
    displayRevenueData = [annualRevenue];
  }

  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "straight",
      width: [2, 2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      x: {
        format: "MMM",
      },
    },
    xaxis: {
      type: "category",
      categories: categories,
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6B7280"],
        },
      },
      title: {
        text: "",
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  const series = [
    {
      name: "Participants",
      data: displayParticipantsData,
    },
    {
      name: "Revenue",
      data: displayRevenueData,
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Statistics
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            {filter} participants and revenue
          </p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          <button
            className={`px-3 py-1 rounded-md ${
              filter === "Monthly"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            }`}
            onClick={() => setFilter("Monthly")}
          >
            Monthly
          </button>
          <button
            className={`px-3 py-1 rounded-md ${
              filter === "Quarterly"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            }`}
            onClick={() => setFilter("Quarterly")}
          >
            Quarterly
          </button>
          <button
            className={`px-3 py-1 rounded-md ${
              filter === "Annually"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
            }`}
            onClick={() => setFilter("Annually")}
          >
            Annually
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <Chart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}