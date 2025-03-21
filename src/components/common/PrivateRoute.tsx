import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; // Assuming you're using an AuthContext

import { ReactNode } from "react";

const PrivateRoute = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth(); // Access authentication state from context
  
  // If not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  // If authenticated, render the child components
  return children;
};

export default PrivateRoute;
