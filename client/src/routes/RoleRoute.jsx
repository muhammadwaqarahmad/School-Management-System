/**
 * ROLE-BASED ROUTE COMPONENT
 * ==========================
 * Protects routes based on user roles
 * - Checks if user is authenticated
 * - Checks if user has required role(s)
 * - Redirects unauthorized users
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  // Show loader while checking authentication
  if (loading) {
    return <Loader />;
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if user's role is in the allowed roles array
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User doesn't have permission - redirect to dashboard with error
    return <Navigate to="/dashboard" replace />;
  }
  
  // User is authenticated and has correct role
  return children;
};

export default RoleRoute;

