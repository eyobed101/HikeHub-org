import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    console.log("User is not authenticated. Redirecting to /signin.");
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;