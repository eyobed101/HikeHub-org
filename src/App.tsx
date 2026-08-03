import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import DashboardStats from "./pages/Superadmin/DashboardStats";
import UserManagement from "./pages/Superadmin/UserManagement";
import OrganizerManagement from "./pages/Superadmin/OrganizerManagement";
import EventManagement from "./pages/Superadmin/EventManagement";
import PaymentAnalytics from "./pages/Superadmin/PaymentAnalytics";
import PlatformAnalytics from "./pages/Superadmin/PlatformAnalytics";
import BankTemplates from "./pages/Superadmin/BankTemplates";
import AdvertisementManagement from "./pages/Superadmin/AdvertisementManagement";
import EventsTable from "./pages/Events/EventsTable";
import ManageParticipants from "./pages/Events/ManageParticipants";
import EngagementAnalytics from "./pages/Events/EngagementAnalytics";
import AuthGuard from "./auth/AuthGuard";
import { ToastContainer } from "react-toastify";
import RoleBasedRoute from "./components/common/RoleBasedRoute";
import ChatPage from "./pages/ChatPage/ChatPage";
import FinanceManager from "./pages/Finance/FinanceManager";
import SuperAdminFinance from "./pages/Superadmin/Finance/SuperAdminFinance";
import TermsAndConditions from "./pages/OtherPage/TermsAndConditions";

const protectedRoutes = [
  // Role-based dashboard routes
  { path: "/", element: <Home />, roles: ['EventOrganizer', 'Superadmin'] },
  { path: "/home", element: <Home />, roles: ['EventOrganizer', 'Superadmin'] },
  { path: "/superadmin/dashboard-stats", element: <DashboardStats />, roles: ['Superadmin'] },
  { path: "/superadmin/users", element: <UserManagement />, roles: ['Superadmin'] },
  { path: "/superadmin/organizers", element: <OrganizerManagement />, roles: ['Superadmin'] },
  { path: "/superadmin/events", element: <EventManagement />, roles: ['Superadmin'] },
  { path: "/superadmin/payments", element: <PaymentAnalytics />, roles: ['Superadmin'] },
  { path: "/superadmin/analytics", element: <PlatformAnalytics />, roles: ['Superadmin'] },
  { path: "/superadmin/bank-templates", element: <BankTemplates />, roles: ['Superadmin'] },

  { path: "/superadmin/advertisements", element: <AdvertisementManagement />, roles: ['Superadmin'] },
  { path: "/superadmin/finance", element: <SuperAdminFinance />, roles: ['Superadmin'] },

  // EventOrganizer specific routes
  { path: "/events", element: <EventsTable />, roles: ['EventOrganizer'] },
  { path: "/manage-participants", element: <ManageParticipants />, roles: ['EventOrganizer'] },
  { path: "/engagement-analytics", element: <EngagementAnalytics />, roles: ['EventOrganizer'] },
  { path: "/profile", element: <UserProfiles />, roles: ['EventOrganizer'] },
  { path: "/messages", element: <ChatPage />, roles: ['EventOrganizer'] },
  { path: "/finance", element: <FinanceManager />, roles: ['EventOrganizer'] },

  // Common routes
  { path: "/calendar", element: <Calendar />, roles: ['EventOrganizer', 'Superadmin'] },
  { path: "/blank", element: <Blank />, roles: ['EventOrganizer', 'Superadmin'] },
  { path: "/form-elements", element: <FormElements />, roles: ['EventOrganizer', 'Superadmin'] },
  { path: "/basic-tables", element: <BasicTables />, roles: ['EventOrganizer', 'Superadmin'] },
  { path: "/alerts", element: <Alerts />, roles: ['EventOrganizer', 'Superadmin'] },
  { path: "/avatars", element: <Avatars />, roles: ['EventOrganizer', 'Superadmin'] },
  { path: "/badge", element: <Badges />, roles: ['EventOrganizer', 'Superadmin'] },
  { path: "/buttons", element: <Buttons />, roles: ['EventOrganizer', 'Superadmin'] },
  { path: "/images", element: <Images />, roles: ['EventOrganizer', 'Superadmin'] },
  { path: "/videos", element: <Videos />, roles: ['EventOrganizer', 'Superadmin'] },
  { path: "/line-chart", element: <LineChart />, roles: ['EventOrganizer', 'Superadmin'] },
  { path: "/bar-chart", element: <BarChart />, roles: ['EventOrganizer', 'Superadmin'] },
];

const PublicOrProtectedTerms = () => {
  const token = sessionStorage.getItem("accessToken");
  if (token) {
    return (
      <AppLayout>
        <TermsAndConditions />
      </AppLayout>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-8">
      <TermsAndConditions />
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <ScrollToTop />

      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/terms" element={<PublicOrProtectedTerms />} />

        <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
          {protectedRoutes.map(({ path, element, roles }) => (
            <Route
              key={path}
              path={path}
              element={
                <AuthGuard>
                  <RoleBasedRoute roles={roles || []}>
                    {element}
                  </RoleBasedRoute>
                </AuthGuard>
              }
            />
          ))}
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

    </Router>
  );
}