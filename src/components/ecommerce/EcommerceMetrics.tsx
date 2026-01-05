import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";

interface MetricsProps {
  metrics: {
    totalParticipants: number;
    totalRevenue: number;
    activeEvents: number;
    totalEvents: number;
  };
  netBalance?: {
    totalTransactionAmount: number;
    totalCommissionAmount: number;
    totalOrganizerAmount: number;
    totalTransactions: number;
  };
}

// Utility function to format numbers with "+" for values >= 10,000 (5 figures)
// Always returns integers (no decimals)
const formatNumber = (value: number): string => {
  const integerValue = Math.round(value);

  if (integerValue >= 10000) {
    return integerValue.toLocaleString('en-US') + '+';
  }

  return integerValue.toLocaleString('en-US');
};

export default function EcommerceMetrics({ metrics, netBalance }: MetricsProps) {
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
      {/* Total Participants */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
          <GroupIcon className="text-blue-600 dark:text-blue-400 size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Participants
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(metrics.totalParticipants)}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            Active
          </Badge>
        </div>
      </div>

      {/* Total Revenue */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl">
          <BoxIconLine className="text-green-600 dark:text-green-400 size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Revenue
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(metrics.totalRevenue)} ETB
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            Verified
          </Badge>
        </div>
      </div>

      {/* Active Events */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
          <GroupIcon className="text-purple-600 dark:text-purple-400 size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Active Events
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(metrics.activeEvents)}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            Ongoing
          </Badge>
        </div>
      </div>

      {/* Total Events */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
          <BoxIconLine className="text-orange-600 dark:text-orange-400 size-6" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total Events
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {formatNumber(metrics.totalEvents)}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            All Time
          </Badge>
        </div>
      </div>

      {/* Net Balance (What You Receive) */}
      {netBalance && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <BoxIconLine className="text-emerald-600 dark:text-emerald-400 size-6" />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Net Balance
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {netBalance.totalOrganizerAmount.toFixed(2)} ETB
              </h4>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                After commission
              </p>
            </div>
            <Badge color="success">
              <ArrowUpIcon />
              Net
            </Badge>
          </div>
        </div>
      )}

      {/* Commission Deducted */}
      {netBalance && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl">
            <ArrowDownIcon className="text-red-600 dark:text-red-400 size-6" />
          </div>
          <div className="flex items-end justify-between mt-5">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Commission Deducted
              </span>
              <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                {netBalance.totalCommissionAmount.toFixed(2)} ETB
              </h4>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Platform fee
              </p>
            </div>
            <Badge color="error">
              <ArrowDownIcon />
              Deducted
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}