import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext"; // Your context to check if the user is authenticated

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth(); // Assuming isAuthenticated is your current authentication status
  const navigate = useNavigate();

  useEffect(() => {
    // If not authenticated, redirect to signin
    if (!isAuthenticated) {
      navigate("/signin");
    }
  }, [isAuthenticated, navigate]); // Rerun the effect if isAuthenticated changes

  // Only render children if the user is authenticated
  return isAuthenticated ? <>{children}</> : null;
};

export default AuthGuard;
