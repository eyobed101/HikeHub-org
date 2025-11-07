import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState, useEffect } from "react";
import { Dropdown } from "../ui/Dropdown/Dropdown";
import { DropdownItem } from "../ui/Dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { Modal } from "../ui/modal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/Button/Button";
import axiosInstance from "../../utils/axiosInstance";
import { message } from "antd";

interface MonthlyTargetProps {
  currentMonthRevenue: number;
  targetRevenue: number;
  progress: number;
  onTargetUpdate?: () => void;
}

// Format number with 100,000+ logic
const formatNumber = (value: number): string => {
  if (value >= 100000) {
    return "100,000+";
  }
  return value.toLocaleString();
};

export default function MonthlyTarget({ currentMonthRevenue, targetRevenue, progress, onTargetUpdate }: MonthlyTargetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetValue, setTargetValue] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [hasTarget, setHasTarget] = useState(targetRevenue > 0);

  useEffect(() => {
    setHasTarget(targetRevenue > 0);
  }, [targetRevenue]);

  const series = [progress]; // Progress percentage for the radial chart
  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: {
          size: "80%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5, // margin is in pixels
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: function (val) {
              return val.toFixed(2) + "%"; // Format progress percentage
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: ["#465FFF"],
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Progress"],
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleSetTarget = () => {
    setTargetValue(targetRevenue > 0 ? targetRevenue.toString() : "");
    setIsModalOpen(true);
    closeDropdown();
  };

  const handleSaveTarget = async () => {
    const target = parseFloat(targetValue);
    
    if (!targetValue || isNaN(target) || target <= 0) {
      message.error("Please enter a valid target amount");
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.put("auth/organizer/monthly-target", {
        monthlyTarget: target,
      });

      if (response.data.status === 1) {
        message.success("Monthly target set successfully!");
        setIsModalOpen(false);
        setHasTarget(true);
        if (onTargetUpdate) {
          onTargetUpdate();
        }
        // Reload page to refresh dashboard data
        window.location.reload();
      } else {
        message.error(response.data.message || "Failed to set target");
      }
    } catch (error: any) {
      console.error("Error setting target:", error);
      message.error(error.response?.data?.message || "Failed to set target. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
          <div className="flex justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Monthly Target
              </h3>
              <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
                {hasTarget ? "Target you've set for this month" : "Set your monthly revenue target"}
              </p>
            </div>
            <div className="relative inline-block">
              <button className="dropdown-toggle" onClick={toggleDropdown}>
                <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
              </button>
              <Dropdown
                isOpen={isOpen}
                onClose={closeDropdown}
                className="w-40 p-2"
              >
                <DropdownItem
                  onItemClick={handleSetTarget}
                  className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                >
                  Set Target
                </DropdownItem>
              </Dropdown>
            </div>
          </div>

          {!hasTarget && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                💡 <strong>Tip:</strong> Set a monthly revenue target to track your progress and stay motivated!
              </p>
            </div>
          )}

          <div className="relative ">
            <div className="max-h-[330px]" id="chartDarkStyle">
              <Chart
                options={options}
                series={series}
                type="radialBar"
                height={330}
              />
            </div>

            <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
              +{progress.toFixed(2)}%
            </span>
          </div>
          <p className="mx-auto mt-10 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
            You've earned {formatNumber(currentMonthRevenue)} ETB this month. {hasTarget ? "Keep up your good work!" : "Set a target to track your progress!"}
          </p>
        </div>

        <div className="flex items-center justify-center gap-5 px-6 py-3.5 sm:gap-8 sm:py-5">
          <div>
            <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
              Target
            </p>
            <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
              {hasTarget ? `${formatNumber(targetRevenue)} ETB` : "Not Set"}
            </p>
          </div>

          <div className="w-px bg-gray-200 h-7 dark:bg-gray-800"></div>

          <div>
            <p className="mb-1 text-center text-gray-500 text-theme-xs dark:text-gray-400 sm:text-sm">
              Revenue
            </p>
            <p className="flex items-center justify-center gap-1 text-base font-semibold text-gray-800 dark:text-white/90 sm:text-lg">
              {formatNumber(currentMonthRevenue)} ETB
            </p>
          </div>
        </div>
      </div>

      {/* Set Target Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Set Monthly Target
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Set your monthly revenue target to track your progress and stay motivated.
            </p>
          </div>
          <div className="px-2 pb-3">
            <div className="mb-6">
              <Label>Monthly Target (ETB) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="Enter target amount"
                min="0"
                step="100"
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Enter the amount you want to achieve this month in ETB.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveTarget} disabled={loading}>
              {loading ? "Saving..." : "Set Target"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}