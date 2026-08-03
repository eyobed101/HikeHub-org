import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { performLogout } from "../utils/logout";

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const token = sessionStorage.getItem("accessToken");

  useEffect(() => {
    // If not authenticated or no token, perform cleanup and redirect to signin
    if (!isAuthenticated || !token) {
      if (isAuthenticated && !token) {
        performLogout();
      }
      navigate("/signin", { replace: true });
    }
  }, [isAuthenticated, token, navigate]);

  // Only render children if the user is authenticated and has a valid token
  return isAuthenticated && token ? <>{children}</> : null;
};

export default AuthGuard;
