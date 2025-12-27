import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface RoleBasedRouteProps {
    roles: string[];
    children: React.ReactNode;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ roles, children }) => {
    const { user } = useSelector((state: RootState) => state.auth);

    // If no user is logged in, redirect to signin
    if (!user) {
        return <Navigate to="/signin" replace />;
    }

    // If user's role is not in the allowed roles, redirect to home or unauthorized page
    if (roles.length > 0 && !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    // If user has the required role, render the children
    return <>{children}</>;
};

export default RoleBasedRoute;
