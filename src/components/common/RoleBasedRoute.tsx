import React, { useEffect } from 'react';
import { Navigate } from 'react-router';
import { getUserRole } from '../../utils/userRole';
import { performLogout } from '../../utils/logout';

interface RoleBasedRouteProps {
    roles: string[];
    children: React.ReactNode;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ roles, children }) => {
    const userRole = getUserRole() || sessionStorage.getItem('userRole');
    const token = sessionStorage.getItem('accessToken');

    useEffect(() => {
        if (!token) {
            performLogout();
        }
    }, [token]);

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
