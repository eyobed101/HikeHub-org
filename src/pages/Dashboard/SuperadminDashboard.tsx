import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import { getUserRole } from "../../utils/userRole";
import { 
  GridIcon, 
  UserCircleIcon, 
  ListIcon, 
  PieChartIcon,
  DollarLineIcon,
  GroupIcon,
  TableIcon,
  BoxCubeIcon,
  PageIcon
} from "../../icons";
import { Link } from "react-router";

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  bgColor: string;
}

export default function SuperadminDashboard() {
  const [role, setRole] = useState<'Superadmin' | 'EventOrganizer' | 'Hiker' | null>(null);

  useEffect(() => {
    setRole(getUserRole());
  }, []);

  // Dashboard cards based on backend endpoints
  const dashboardCards: DashboardCard[] = [
    {
      title: "Dashboard Statistics",
      description: "View comprehensive platform statistics, user growth, events, and payments overview",
      icon: <GridIcon className="w-8 h-8" />,
      path: "/superadmin/dashboard-stats",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "User Management",
      description: "Manage all users, view details, update roles, block/unblock users",
      icon: <UserCircleIcon className="w-8 h-8" />,
      path: "/superadmin/users",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    },
    {
      title: "Organizer Management",
      description: "Manage event organizers, approve/reject profiles, update commission rates",
      icon: <GroupIcon className="w-8 h-8" />,
      path: "/superadmin/organizers",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      title: "Event Management",
      description: "View all events, approve/reject events, manage event statuses",
      icon: <ListIcon className="w-8 h-8" />,
      path: "/superadmin/events",
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20"
    },
    {
      title: "Payment Management",
      description: "View all payments, payment analytics, and transaction details",
      icon: <DollarLineIcon className="w-8 h-8" />,
      path: "/superadmin/payments",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20"
    },
    {
      title: "Revenue Reports",
      description: "View detailed revenue reports, commission tracking, and financial analytics",
      icon: <PieChartIcon className="w-8 h-8" />,
      path: "/superadmin/revenue-reports",
      color: "text-rose-600",
      bgColor: "bg-rose-50 dark:bg-rose-900/20"
    },
    {
      title: "Platform Analytics",
      description: "Comprehensive platform analytics, growth trends, and performance metrics",
      icon: <BoxCubeIcon className="w-8 h-8" />,
      path: "/superadmin/analytics",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-900/20"
    },
    {
      title: "Bank Templates",
      description: "Manage bank templates, add/edit bank information for organizers",
      icon: <TableIcon className="w-8 h-8" />,
      path: "/superadmin/bank-templates",
      color: "text-teal-600",
      bgColor: "bg-teal-50 dark:bg-teal-900/20"
    },
    {
      title: "Advertisement Management",
      description: "Create, update, and manage platform advertisements",
      icon: <PageIcon className="w-8 h-8" />,
      path: "/superadmin/advertisements",
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-900/20"
    }
  ];

  if (role !== 'Superadmin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="HikeHub | Superadmin Dashboard" description="Superadmin management dashboard" />
      <PageBreadcrumb pageTitle="Superadmin Dashboard" />

      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-2">
          Welcome to Superadmin Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your platform, users, events, and revenue from one central location.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {dashboardCards.map((card, index) => (
          <Link
            key={index}
            to={card.path}
            className="block"
          >
            <ComponentCard>
              <div className={`p-6 rounded-lg ${card.bgColor} mb-4 flex items-center justify-center`}>
                <div className={card.color}>
                  {card.icon}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
                {card.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {card.description}
              </p>
              <div className="mt-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                View Details →
              </div>
            </ComponentCard>
          </Link>
        ))}
      </div>

      {/* Quick Stats Placeholder */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <ComponentCard>
          <div className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Users</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">-</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Coming soon</p>
          </div>
        </ComponentCard>
        <ComponentCard>
          <div className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Events</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">-</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Coming soon</p>
          </div>
        </ComponentCard>
        <ComponentCard>
          <div className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">-</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Coming soon</p>
          </div>
        </ComponentCard>
        <ComponentCard>
          <div className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Platform Commission</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">-</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Coming soon</p>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}

