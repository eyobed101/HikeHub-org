import React from 'react';
import { Navigate } from 'react-router-dom';
import { getUserRole } from '../../utils/userRole';

interface RoleBasedRouteProps {
    roles: string[];
    children: React.ReactNode;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ roles, children }) => {
    const userRole = getUserRole();
    const token = sessionStorage.getItem('accessToken');

    // If no user is logged in (no token), redirect to signin
    if (!token) {
        return <Navigate to="/signin" replace />;
    }

    // If user's role is not in the allowed roles, redirect to signin
    if (roles.length > 0 && userRole && !roles.includes(userRole)) {
        return <Navigate to="/signin" replace />;
    }

    // If user has the required role, render the children
    return <>{children}</>;
};

export default RoleBasedRoute;
