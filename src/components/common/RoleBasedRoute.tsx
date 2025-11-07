import { ReactNode } from "react";
import { useNavigate } from "react-router";
import { getUserRole } from "../../utils/userRole";

interface RoleBasedRouteProps {
  children: ReactNode;
  roles: ('Superadmin' | 'EventOrganizer' | 'Hiker')[];
}

export default function RoleBasedRoute({ children, roles }: RoleBasedRouteProps) {
  const navigate = useNavigate();
  const userRole = getUserRole();

  // If no roles specified, allow all authenticated users
  if (roles.length === 0) {
    return <>{children}</>;
  }

  // Check if user role is in allowed roles
  if (!userRole || !roles.includes(userRole)) {
    // Redirect based on role
    if (userRole === 'Superadmin') {
      navigate('/superadmin');
    } else if (userRole === 'EventOrganizer') {
      navigate('/home');
    } else {
      navigate('/signin');
    }
    return null;
  }

  return <>{children}</>;
}

