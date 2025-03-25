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
import EventsTable from "./pages/Events/EventsTable";
import AuthGuard from "./auth/AuthGuard";
import { ToastContainer } from "react-toastify";
import ChatPage from "./pages/Chats/ChatPage";

const protectedRoutes = [
  { path: "/", element: <Home /> },
  { path: "/home", element: <Home /> },
  { path: "/events", element: <EventsTable /> },
  { path: "/profile", element: <UserProfiles /> },
  { path: "/calendar", element: <Calendar /> },
  { path: "/blank", element: <Blank /> },
  { path: "/form-elements", element: <FormElements /> },
  { path: "/basic-tables", element: <BasicTables /> },
  { path: "/alerts", element: <Alerts /> },
  { path: "/avatars", element: <Avatars /> },
  { path: "/badge", element: <Badges /> },
  { path: "/buttons", element: <Buttons /> },
  { path: "/images", element: <Images /> },
  { path: "/videos", element: <Videos /> },
  { path: "/line-chart", element: <LineChart /> },
  { path: "/bar-chart", element: <BarChart /> },
  { path: "/chat", element: <ChatPage /> },
];

export default function App() {
  return (
    <Router>
      <ScrollToTop />
     
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
          {protectedRoutes.map(({ path, element }) => (
            <Route
              key={path}
              path={path}
              element={<AuthGuard>{element}</AuthGuard>}
            />
          ))}
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      
    </Router>
  );
}